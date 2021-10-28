// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "./helpers/ERC1155Proxy.sol";
import "./helpers/ERC20Proxy.sol";
import "./helpers/ERC721Proxy.sol";
import "./interfaces/IRFQOrder.sol";
import "./interfaces/ITradingSession.sol";
import "./interfaces/IBalanceAccessor.sol";
import "./interfaces/IPeripheryCallback.sol";
import "./libraries/UncheckedAddress.sol";
import "./libraries/ArgumentsDecoder.sol";

/*
    Abbreviations
    TA - Taker asset
    MA - Maker asset
    TAD - Taker asset data
    MAD - Maker asset data
    SK - Session key
*/

// @title LLDEX Protocol v1
contract LLDEXProtocol is
    ImmutableOwner(address(this)),
    EIP712("1inch Limit Order Protocol", "1"),
    ERC1155Proxy,
    ERC20Proxy,
    ERC721Proxy,
    ReentrancyGuard,
    IRFQOrder,
    ITradingSession,
    IBalanceAccessor
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using UncheckedAddress for address;
    using ArgumentsDecoder for bytes;

    modifier makerSessionNotExpired(OrderRFQ memory order, bytes memory signature) {
        // Require maker session to be valid, ie. not expired
        address maker = order.makerAssetData.decodeAddress(_FROM_INDEX);
        require(
            _sessions[maker].expirationTime > block.timestamp,
            "LLDEX: expired maker session"
        );

        _;
    }

    bytes32 public constant LIMIT_ORDER_RFQ_TYPEHASH =
        keccak256(
            "OrderRFQ(uint256 info,uint256 feeAmount,address takerAsset,address makerAsset,address feeTokenAddress,address frontendAddress,bytes takerAssetData,bytes makerAssetData)"
        );

    // solhint-disable-next-line var-name-mixedcase
    bytes4 private immutable _MAX_SELECTOR = bytes4(uint32(IERC20.transferFrom.selector) + 10);

    uint256 private constant _FROM_INDEX = 0;
    uint256 private constant _TO_INDEX = 1;
    uint256 private constant _AMOUNT_INDEX = 2;

    mapping(address => mapping(uint256 => uint256)) private _invalidator;

    // Mapping of balance owner (either maker or frontend) to amount
    mapping(address => mapping(address => Balance)) private _balances;

    // Mapping of session owner to session
    mapping(address => Session) private _sessions;

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice Returns bitmask for double-spend invalidators based on lowest byte of order.info and filled quotes
    /// @return Result Each bit represents whenever corresponding quote was filled
    function invalidatorForOrderRFQ(address taker, uint256 slot)
        external
        view
        returns (uint256)
    {
        return _invalidator[taker][slot];
    }

    function cancelOrderRFQ(uint256 orderInfo) external override {
        _invalidator[msg.sender][uint64(orderInfo) >> 8] |= (1 << (orderInfo & 0xff));
    }

    function fillOrderRFQ(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    )
        external
        override
        makerSessionNotExpired(order, signature)
        returns (OrderRFQAmounts memory amounts)
    {
        amounts = OrderRFQAmounts({takingAmount: takingAmount, makingAmount: makingAmount});

        fillOrderRFQTo(order, amounts, signature, msg.sender);
    }

    function fillOrderRFQCallPeriphery(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address receiver,
        bytes calldata data
    )
        external
        override
        makerSessionNotExpired(order, signature)
        returns (OrderRFQAmounts memory amounts, bytes memory result)
    {
        // Contract receiving external function call cannot be empty
        require(receiver != address(0), "LLDEX: zero receiver address");
        // And the address cannot be the address of LLDEX contract
        require(receiver != address(this), "LLDEX: invalid receiver address");

        amounts = OrderRFQAmounts({takingAmount: takingAmount, makingAmount: makingAmount});

        // Validate and fill order, transfer assets from taker to maker then call external function on receiver
        // and finally transfer assets from maker to taker and emit OrderFilledRFQ event
        result = fillOrderRFQToWithCallback(order, amounts, signature, receiver, data);
    }

    function fillOrderRFQToWithCallback(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature,
        address receiver,
        bytes calldata data
    ) private returns (bytes memory result) {
        // Validate order, check signature, calculate hash of the order
        bytes32 orderHash = _validateRFQOrder(order, amounts, signature);

        // Transfer Taker => Maker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            msg.sender,
            amounts.takingAmount
        );

        // Address of maker that fills this RFQ order
        address orderMakerAddress = order.makerAssetData.decodeAddress(_FROM_INDEX);

        // Callback info containing tokens and amounts
        OrderRFQCallbackInfo memory orderInfo = OrderRFQCallbackInfo({
            takerAsset: order.takerAsset,
            makerAsset: order.makerAsset,
            takingAmount: amounts.takingAmount,
            makingAmount: amounts.makingAmount
        });

        // Call provided receiver using peripery callback
        result = IPeripheryCallback(receiver).lldexPeripheryCallback(
            orderMakerAddress,
            orderInfo,
            data
        );

        // Transfer Maker => Taker
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            amounts.makingAmount
        );

        _finishRFQOrder(order, amounts, orderHash);
    }

    function fillOrderRFQTo(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature,
        address target
    ) private returns (uint256, uint256) {
        bytes32 orderHash = _validateRFQOrder(order, amounts, signature);

        // Transfer Taker => Maker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            target,
            amounts.takingAmount
        );

        // Transfer Maker => Taker
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            amounts.makingAmount
        );

        _finishRFQOrder(order, amounts, orderHash);

        return (amounts.takingAmount, amounts.makingAmount);
    }

    function _validateRFQOrder(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature
    ) internal returns (bytes32 orderHash) {
        // Check time expiration
        uint256 expiration = uint128(order.info) >> 64;
        require(expiration == 0 || block.timestamp <= expiration, "LLDEX: order expired"); // solhint-disable-line not-rely-on-time

        {
            // Stack too deep
            // Validate double spend
            address taker = order.takerAssetData.decodeAddress(_FROM_INDEX);
            uint256 invalidatorSlot = uint64(order.info) >> 8;
            uint256 invalidatorBit = 1 << uint8(order.info);
            uint256 invalidator = _invalidator[taker][invalidatorSlot];
            require(invalidator & invalidatorBit == 0, "LLDEX: already filled");
            _invalidator[taker][invalidatorSlot] = invalidator | invalidatorBit;
        }

        // Compute partial fill if needed
        uint256 orderTakerAmount = order.takerAssetData.decodeUint256(_AMOUNT_INDEX);
        uint256 orderMakerAmount = order.makerAssetData.decodeUint256(_AMOUNT_INDEX);

        if (amounts.makingAmount == 0 && amounts.takingAmount == 0) {
            // Fill whole order
            amounts.takingAmount = orderTakerAmount;
            amounts.makingAmount = orderMakerAmount;
        } else if (
            amounts.takingAmount != 0 &&
            (amounts.makingAmount >
                (amounts.takingAmount * orderMakerAmount + orderTakerAmount - 1) /
                    orderTakerAmount)
        ) // solhint-disable-next-line no-empty-blocks
        {
            // Partial fill with positive slippage
        } else if (amounts.makingAmount == 0) {
            amounts.makingAmount =
                (amounts.takingAmount * orderMakerAmount + orderTakerAmount - 1) /
                orderTakerAmount;
        } else {
            revert("LLDEX: one amount should be 0");
        }

        require(
            amounts.takingAmount > 0 && amounts.makingAmount > 0,
            "LLDEX: cannot swap 0 amount"
        );

        require(amounts.takingAmount <= orderTakerAmount, "LLDEX: taking amount exceeded");

        // Validate order
        orderHash = _hash(order);
        _validate(order.takerAssetData, order.makerAssetData, signature, orderHash);
    }

    function _finishRFQOrder(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes32 orderHash
    ) internal {
        // Withdraw fee
        _withdrawFee(
            order.makerAssetData.decodeAddress(_TO_INDEX),
            order.frontendAddress,
            order.feeTokenAddress,
            order.feeAmount
        );

        _updateSessionTransactions(order.takerAssetData, order.makerAssetData);

        emit OrderFilledRFQ(orderHash, amounts.takingAmount, amounts.makingAmount);
    }

    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        override
        nonReentrant
        returns (SessionStatus)
    {
        _validateSessionKey(sessionKey);
        require(expirationTime >= block.timestamp, "LLDEX: invalid expiration time");

        // Update current session if session slot exists
        if (_sessions[msg.sender].sessionKey != address(0)) {
            _sessions[msg.sender].expirationTime = expirationTime;

            // Update session key if its different from the storage key
            if (_sessions[msg.sender].sessionKey != sessionKey) {
                _sessions[msg.sender].sessionKey = sessionKey;
            }

            emit SessionUpdated(msg.sender, _sessions[msg.sender].sessionKey, expirationTime);

            return SessionStatus.Updated;
        } else {
            _sessions[msg.sender] = Session({
                creator: address(msg.sender),
                sessionKey: sessionKey,
                expirationTime: expirationTime,
                txCount: 0
            });

            emit SessionCreated(msg.sender, _sessions[msg.sender].sessionKey, expirationTime);
        }

        return SessionStatus.Created;
    }

    function endSession() external override nonReentrant {
        _validateSessionKey(_sessions[msg.sender].sessionKey);
        require(_sessions[msg.sender].expirationTime != 0, "LLDEX: invalid session");
        require(
            _sessions[msg.sender].expirationTime >= block.timestamp,
            "LLDEX: session expired"
        );

        _sessions[msg.sender].expirationTime = 0;

        emit SessionTerminated(msg.sender, _sessions[msg.sender].sessionKey);
    }

    function sessionExpirationTime(address owner)
        external
        view
        override
        returns (uint256 expirationTime)
    {
        return _sessions[owner].expirationTime;
    }

    function session(address owner)
        external
        view
        override
        returns (
            address creator,
            address sessionKey,
            uint256 expirationTime,
            uint256 txCount
        )
    {
        return (
            _sessions[owner].creator,
            _sessions[owner].sessionKey,
            _sessions[owner].expirationTime,
            _sessions[owner].txCount
        );
    }

    function _validateSessionKey(address sessionKey) internal view {
        require(sessionKey != address(0), "LLDEX: SK is empty");
        require(sessionKey != address(this), "LLDEX: invalid SK");
        require(sessionKey != msg.sender, "LLDEX: invalid SK - sender");
    }

    function _hash(OrderRFQ memory order) private view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        LIMIT_ORDER_RFQ_TYPEHASH,
                        order.info,
                        order.feeAmount,
                        order.takerAsset,
                        order.makerAsset,
                        order.feeTokenAddress,
                        order.frontendAddress,
                        keccak256(order.takerAssetData),
                        keccak256(order.makerAssetData)
                    )
                )
            );
    }

    function _validate(
        bytes memory takerAssetData,
        bytes memory makerAssetData,
        bytes memory signature,
        bytes32 orderHash
    ) private view {
        require(takerAssetData.length >= 100, "LLDEX: bad TAD length");
        require(makerAssetData.length >= 100, "LLDEX: bad MAD length");
        bytes4 takerSelector = takerAssetData.decodeSelector();
        bytes4 makerSelector = makerAssetData.decodeSelector();
        require(
            takerSelector >= IERC20.transferFrom.selector && takerSelector <= _MAX_SELECTOR,
            "LLDEX: bad TAD selector"
        );
        require(
            makerSelector >= IERC20.transferFrom.selector && makerSelector <= _MAX_SELECTOR,
            "LLDEX: bad MAD selector"
        );

        address taker = address(takerAssetData.decodeAddress(_FROM_INDEX));
        if (_sessions[taker].expirationTime > block.timestamp) {
            // Session not expired

            require(
                SignatureChecker.isValidSignatureNow(
                    _sessions[taker].sessionKey,
                    orderHash,
                    signature
                ),
                "LLDEX: SNE bad signature"
            );
        } else {
            // Sesssion is expired - checking if market taker has signed the request with it's own private key (used to save gas on the market taker side)

            require(
                SignatureChecker.isValidSignatureNow(taker, orderHash, signature),
                "LLDEX: SE bad signature"
            );
        }
    }

    function _callTakerAssetTransferFrom(
        address takerAsset,
        bytes memory takerAssetData,
        address maker,
        uint256 takingAmount
    ) private {
        // Patch receiver or validate private order
        address orderMakerAddress = takerAssetData.decodeAddress(_TO_INDEX);

        if (orderMakerAddress != address(0)) {
            require(
                msg.sender == _sessions[orderMakerAddress].sessionKey,
                "LLDEX: private order"
            );
        }

        if (orderMakerAddress != maker) {
            takerAssetData.patchAddress(
                _TO_INDEX,
                /*_sessionOwners[msg.sender]*/
                orderMakerAddress
            );
        }

        // Patch taker amount
        takerAssetData.patchUint256(_AMOUNT_INDEX, takingAmount);

        require(
            takerAsset != address(0) &&
                takerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LLDEX: raw ETH is not supported"
        );

        // Transfer asset from taker to maker
        bytes memory result = takerAsset.uncheckedFunctionCall(
            takerAssetData,
            "LLDEX: takerAsset.call failed"
        );
        if (result.length > 0) {
            require(abi.decode(result, (bool)), "LLDEX: TA call bad result");
        }
    }

    function _callMakerAssetTransferFrom(
        address makerAsset,
        bytes memory makerAssetData,
        uint256 makingAmount
    ) private {
        address orderMakerAddress = makerAssetData.decodeAddress(_FROM_INDEX);

        if (orderMakerAddress != address(0)) {
            require(
                msg.sender == _sessions[orderMakerAddress].sessionKey,
                "LLDEX: private order"
            );
        }

        // Patch maker amount
        makerAssetData.patchUint256(_AMOUNT_INDEX, makingAmount);

        require(
            makerAsset != address(0) &&
                makerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LLDEX: raw ETH is not supported"
        );

        // Transfer asset from maker to taker
        bytes memory result = makerAsset.uncheckedFunctionCall(
            makerAssetData,
            "LLDEX: makerAsset.call failed"
        );
        if (result.length > 0) {
            require(abi.decode(result, (bool)), "LLDEX: MA call bad result");
        }
    }

    function _updateSessionTransactions(
        bytes memory takerAssetData,
        bytes memory makerAssetData
    ) internal returns (uint256 txCountTaker, uint256 txCountMaker) {
        address orderTakerAddress = takerAssetData.decodeAddress(_TO_INDEX);
        require(orderTakerAddress != address(0), "LLDEX: maker address is empty");

        address orderMakerAddress = makerAssetData.decodeAddress(_TO_INDEX);
        require(orderMakerAddress != address(0), "LLDEX: taker address is empty");

        txCountTaker = ++_sessions[orderTakerAddress].txCount;
        txCountMaker = ++_sessions[orderMakerAddress].txCount;
    }

    function _withdrawFee(
        address maker,
        address frontend,
        address feeToken,
        uint256 feeAmount
    ) internal {
        require(feeToken != address(0), "LLDEX: fee token empty");
        require(feeToken != address(this), "LLDEX: invalid fee token address");
        require(
            _balances[maker][feeToken].balance >= feeAmount,
            "LLDEX: insufficient maker fee"
        );

        _balances[maker][feeToken].balance -= feeAmount;
        _balances[frontend][feeToken].balance += feeAmount;
    }

    function depositToken(address token, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(token != address(0), "LLDEX: empty fee token");
        require(token != address(this), "LLDEX: invalid fee token");
        require(amount > 0, "LLDEX: amount is 0");

        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.safeTransferFrom(msg.sender, address(this), amount);

        _balances[msg.sender][token].balance += amount;
        return _balances[msg.sender][token].balance;
    }

    function withdrawToken(address token, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(token != address(0), "LLDEX: empty fee token");
        require(token != address(this), "LLDEX: invalid fee token");
        require(amount > 0, "LLDEX: amount is 0");
        require(_balances[msg.sender][token].balance >= amount, "LLDEX: insufficient balance");

        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.safeTransfer(msg.sender, amount);

        _balances[msg.sender][token].balance -= amount;

        return _balances[msg.sender][token].balance;
    }

    function balance(address token) external view override returns (uint256) {
        return _balances[msg.sender][token].balance;
    }
}
