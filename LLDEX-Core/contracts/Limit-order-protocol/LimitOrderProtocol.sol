// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts_v42/interfaces/IERC1271.sol";
import "@openzeppelin/contracts_v42/utils/math/SafeMath.sol";
import "@openzeppelin/contracts_v42/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts_v42/token/ERC20/extensions/draft-ERC20Permit.sol";

import "./helpers/AmountCalculator.sol";
import "./helpers/ChainlinkCalculator.sol";
import "./helpers/ERC1155Proxy.sol";
import "./helpers/ERC20Proxy.sol";
import "./helpers/ERC721Proxy.sol";
import "./helpers/NonceManager.sol";
import "./helpers/PredicateHelper.sol";
import "./helpers/Multicall.sol";
import "./interfaces/InteractiveMaker.sol";
import "./interfaces/ITradingSession.sol";
import "./interfaces/IBalanceAccessor.sol";
import "./libraries/UncheckedAddress.sol";
import "./libraries/ArgumentsDecoder.sol";
import "./libraries/SilentECDSA.sol";

import "hardhat/console.sol";

/// @title 1inch Limit Order Protocol v1
contract LimitOrderProtocol is
    ImmutableOwner(address(this)),
    EIP712("1inch Limit Order Protocol", "1"),
    AmountCalculator,
    ChainlinkCalculator,
    ERC1155Proxy,
    ERC20Proxy,
    ERC721Proxy,
    NonceManager,
    PredicateHelper,
    ReentrancyGuard,
    UniswapInterfaceMulticall,
    ITradingSession,
    IBalanceAccessor
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using UncheckedAddress for address;
    using ArgumentsDecoder for bytes;

    // Expiration Mask:
    //   predicate := PredicateHelper.timestampBelow(deadline)
    //
    // Taker Nonce:
    //   predicate := this.nonceEquals(takerAddress, takerNonce)

    modifier sessionNotExpired(OrderRFQ memory order) {
        // Require taker session to be valid, ie. not expired
        address taker = order.takerAssetData.decodeAddress(_FROM_INDEX);
        require(
            _sessions[taker].expirationTime >= block.timestamp,
            "LOP: EXP MAKER"
        );

        // Require maker session to be valid, ie. not expired
        address maker = order.makerAssetData.decodeAddress(_FROM_INDEX);
        require(
            _sessions[maker].expirationTime >= block.timestamp,
            "LOP: EXP TAKER"
        );

        _;
    }

    event OrderFilled(
        address indexed taker,
        bytes32 orderHash,
        uint256 remaining
    );

    event OrderFilledRFQ(bytes32 orderHash, uint256 takingAmount);

    struct OrderRFQ {
        uint256 info;
        uint256 feeAmount;
        address takerAsset;
        address makerAsset;
        address feeTokenAddress;
        address frontendAddress;
        bytes takerAssetData; // (transferFrom.selector, signer, ______, takerAmount, ...)
        bytes makerAssetData; // (transferFrom.selector, sender, signer, makerAmount, ...)
    }

    struct Order {
        uint256 salt;
        address takerAsset;
        address makerAsset;
        bytes takerAssetData; // (transferFrom.selector, signer, ______, takerAmount, ...)
        bytes makerAssetData; // (transferFrom.selector, sender, signer, makerAmount, ...)
        bytes getTakerAmount; // this.staticcall(abi.encodePacked(bytes, swapMakerAmount)) => (swapTakerAmount)
        bytes getMakerAmount; // this.staticcall(abi.encodePacked(bytes, swapTakerAmount)) => (swapMakerAmount)
        bytes predicate; // this.staticcall(bytes) => (bool)
        bytes permit; // On first fill: permit.1.call(abi.encodePacked(permit.selector, permit.2))
        bytes interaction;
    }

    bytes32 public constant LIMIT_ORDER_TYPEHASH =
        keccak256(
            "Order(uint256 salt,address takerAsset,address makerAsset,bytes takerAssetData,bytes makerAssetData,bytes getTakerAmount,bytes getMakerAmount,bytes predicate,bytes permit,bytes interaction)"
        );

    bytes32 public constant LIMIT_ORDER_RFQ_TYPEHASH =
        keccak256(
            "OrderRFQ(uint256 info,uint256 feeAmount,address takerAsset,address makerAsset,address feeTokenAddress,address frontendAddress,bytes takerAssetData,bytes makerAssetData)"
        );

    // solhint-disable-next-line var-name-mixedcase
    bytes4 private immutable _MAX_SELECTOR =
        bytes4(uint32(IERC20.transferFrom.selector) + 10);

    uint256 private constant _FROM_INDEX = 0;
    uint256 private constant _TO_INDEX = 1;
    uint256 private constant _AMOUNT_INDEX = 2;

    mapping(bytes32 => uint256) private _remaining;
    mapping(address => mapping(uint256 => uint256)) private _invalidator;

    // Mapping of balance owner (either maker or frontend) to amount
    mapping(address => mapping(address => Balance)) private _balances;
    // Mapping of session owner to session
    mapping(address => Session) private _sessions;
    // Mapping of session public key to session owner
    mapping(address => address) private _sessionOwners;

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice Returns unfilled amount for order. Throws if order does not exist
    function remaining(bytes32 orderHash) external view returns (uint256) {
        return _remaining[orderHash].sub(1, "LOP: Unknown order");
    }

    /// @notice Returns unfilled amount for order
    /// @return Result Unfilled amount of order plus one if order exists. Otherwise 0
    function remainingRaw(bytes32 orderHash) external view returns (uint256) {
        return _remaining[orderHash];
    }

    /// @notice Same as `remainingRaw` but for multiple orders
    function remainingsRaw(bytes32[] memory orderHashes)
        external
        view
        returns (uint256[] memory results)
    {
        results = new uint256[](orderHashes.length);
        for (uint256 i = 0; i < orderHashes.length; i++) {
            results[i] = _remaining[orderHashes[i]];
        }
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

    /// @notice Checks order predicate
    function checkPredicate(Order memory order) public view returns (bool) {
        bytes memory result = address(this).uncheckedFunctionStaticCall(
            order.predicate,
            "LOP: predicate call failed"
        );
        require(result.length == 32, "LOP: invalid predicate return");
        return abi.decode(result, (bool));
    }

    /**
     * @notice Calls every target with corresponding data. Then reverts with CALL_RESULTS_0101011 where zeroes and ones
     * denote failure or success of the corresponding call
     * @param targets Array of addresses that will be called
     * @param data Array of data that will be passed to each call
     */
    function simulateCalls(address[] calldata targets, bytes[] calldata data)
        external
    {
        require(targets.length == data.length, "LOP: array size mismatch");
        bytes memory reason = new bytes(targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory result) = targets[i].call(data[i]);
            if (success && result.length > 0) {
                success = abi.decode(result, (bool));
            }
            reason[i] = success ? bytes1("1") : bytes1("0");
        }

        // Always revert and provide per call results
        revert(string(abi.encodePacked("CALL_RESULTS_", reason)));
    }

    /// @notice Cancels order by setting remaining amount to zero
    function cancelOrder(Order memory order) external {
        require(
            order.takerAssetData.decodeAddress(_FROM_INDEX) == msg.sender,
            "LOP: Access denied"
        );

        bytes32 orderHash = _hash(order);
        _remaining[orderHash] = 1;
        emit OrderFilled(msg.sender, orderHash, 0);
    }

    /// @notice Cancels order's quote
    function cancelOrderRFQ(uint256 orderInfo) external {
        _invalidator[msg.sender][uint64(orderInfo) >> 8] |= (1 <<
            (orderInfo & 0xff));
    }

    /// @notice Fills order's quote, fully or partially (whichever is possible)
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    function fillOrderRFQ(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    ) external sessionNotExpired(order) returns (uint256, uint256) {
        return
            fillOrderRFQTo(
                order,
                signature,
                takingAmount,
                makingAmount,
                msg.sender
            );
    }

    function fillOrderRFQToWithPermit(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address target,
        bytes calldata permit
    ) external returns (uint256, uint256) {
        _permit(permit);
        return
            fillOrderRFQTo(
                order,
                signature,
                takingAmount,
                makingAmount,
                target
            );
    }

    function fillOrderRFQTo(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address target
    ) public returns (uint256, uint256) {
        // Check time expiration
        uint256 expiration = uint128(order.info) >> 64;
        require(
            expiration == 0 || block.timestamp <= expiration,
            "LOP: order expired"
        ); // solhint-disable-line not-rely-on-time

        {
            // Stack too deep
            // Validate double spend
            address taker = order.takerAssetData.decodeAddress(_FROM_INDEX);
            uint256 invalidatorSlot = uint64(order.info) >> 8;
            uint256 invalidatorBit = 1 << uint8(order.info);
            uint256 invalidator = _invalidator[taker][invalidatorSlot];
            require(invalidator & invalidatorBit == 0, "LOP: already filled");
            _invalidator[taker][invalidatorSlot] = invalidator | invalidatorBit;
        }

        // Compute partial fill if needed
        uint256 orderTakerAmount = order.takerAssetData.decodeUint256(
            _AMOUNT_INDEX
        );
        uint256 orderMakerAmount = order.makerAssetData.decodeUint256(
            _AMOUNT_INDEX
        );
        if (makingAmount == 0 && takingAmount == 0) {
            // Two zeros means whole order
            takingAmount = orderTakerAmount;
            makingAmount = orderMakerAmount;
        } else if (makingAmount == 0) {
            makingAmount =
                (takingAmount * orderMakerAmount + orderTakerAmount - 1) /
                orderTakerAmount;
        } else if (takingAmount == 0) {
            //takingAmount = (makingAmount * orderTakerAmount) / orderMakerAmount;

            // If making amount is specified, taking amount should stay the same as in signed RFQ order
            takingAmount = orderTakerAmount;
        } else {
            revert("LOP: one of amounts should be 0");
        }

        // console.log("Taking amount: %s", takingAmount);
        // console.log("Making amount: %s", makingAmount);

        require(
            takingAmount > 0 && makingAmount > 0,
            "LOP: can't swap 0 amount"
        );
        require(
            takingAmount <= orderTakerAmount,
            "LOP: taking amount exceeded"
        );

        // Let maker make transaction for bigger quote than order makingAmount
        require(
            makingAmount >= orderMakerAmount,
            "LOP: making amount exceeded"
        );

        // Validate order
        bytes32 orderHash = _hash(order);
        _validate(
            order.takerAssetData,
            order.makerAssetData,
            signature,
            orderHash
        );

        // Taker => Maker, Maker => Taker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            target,
            takingAmount
        );
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            makingAmount
        );

        _updateSessionTransactions(order.takerAssetData, order.makerAssetData);

        emit OrderFilledRFQ(orderHash, takingAmount);
        return (takingAmount, makingAmount);
    }

    /// @notice Fills an order. If one doesn't exist (first fill) it will be created using order.takerAssetData
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    /// @param thresholdAmount If takingAmout > 0 this is max makingAmount, else it is min takingAmount
    function fillOrder(
        Order memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        uint256 thresholdAmount
    ) external returns (uint256, uint256) {
        return
            fillOrderTo(
                order,
                signature,
                takingAmount,
                makingAmount,
                thresholdAmount,
                msg.sender
            );
    }

    function fillOrderToWithPermit(
        Order memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        uint256 thresholdAmount,
        address target,
        bytes calldata permit
    ) external returns (uint256, uint256) {
        _permit(permit);
        return
            fillOrderTo(
                order,
                signature,
                takingAmount,
                makingAmount,
                thresholdAmount,
                target
            );
    }

    function fillOrderTo(
        Order memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        uint256 thresholdAmount,
        address target
    ) public returns (uint256, uint256) {
        bytes32 orderHash = _hash(order);

        {
            // Stack too deep
            uint256 remainingTakerAmount;
            {
                // Stack too deep
                bool orderExists;
                (orderExists, remainingTakerAmount) = _remaining[orderHash]
                    .trySub(1);
                if (!orderExists) {
                    // First fill: validate order and permit taker asset
                    _validate(
                        order.takerAssetData,
                        order.makerAssetData,
                        signature,
                        orderHash
                    );
                    remainingTakerAmount = order.takerAssetData.decodeUint256(
                        _AMOUNT_INDEX
                    );
                    if (order.permit.length > 0) {
                        _permit(order.permit);
                        require(
                            _remaining[orderHash] == 0,
                            "LOP: reentrancy detected"
                        );
                    }
                }
            }

            // Check if order is valid
            if (order.predicate.length > 0) {
                require(checkPredicate(order), "LOP: predicate returned false");
            }

            // Compute taker and maker assets amount
            if ((makingAmount == 0) == (takingAmount == 0)) {
                revert("LOP: only one amount should be 0");
            } else if (makingAmount == 0) {
                if (takingAmount > remainingTakerAmount) {
                    takingAmount = remainingTakerAmount;
                }
                makingAmount = _callGetMakerAmount(order, takingAmount);
                require(
                    makingAmount <= thresholdAmount,
                    "LOP: making amount too high"
                );
            } else {
                takingAmount = _callGetTakerAmount(order, makingAmount);
                if (takingAmount > remainingTakerAmount) {
                    takingAmount = remainingTakerAmount;
                    makingAmount = _callGetMakerAmount(order, takingAmount);
                }
                require(
                    takingAmount >= thresholdAmount,
                    "LOP: taking amount too low"
                );
            }

            require(
                takingAmount > 0 && makingAmount > 0,
                "LOP: can't swap 0 amount"
            );

            // Update remaining amount in storage

            unchecked {
                remainingTakerAmount = remainingTakerAmount - takingAmount;
                _remaining[orderHash] = remainingTakerAmount + 1;
            }
            emit OrderFilled(msg.sender, orderHash, remainingTakerAmount);
        }

        // Maker => Taker
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            makingAmount
        );

        // Taker can handle funds interactively
        if (order.interaction.length > 0) {
            InteractiveMaker(order.takerAssetData.decodeAddress(_FROM_INDEX))
                .notifyFillOrder(
                    order.takerAsset,
                    order.makerAsset,
                    takingAmount,
                    makingAmount,
                    order.interaction
                );
        }

        // Taker => Maker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            target,
            takingAmount
        );

        return (takingAmount, makingAmount);
    }

    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        override
        nonReentrant
        returns (SessionStatus)
    {
        _validateSessionKey(sessionKey);
        require(
            _sessionOwners[sessionKey] == address(0) ||
                _sessionOwners[sessionKey] == msg.sender,
            "LOP: ISO"
        );
        require(expirationTime >= block.timestamp, "LOP: EXP");

        // Update current session if session slot exists
        if (_sessions[msg.sender].sessionKey != address(0)) {
            _sessions[msg.sender].expirationTime = expirationTime;

            // Update session key if its different from the storage key
            if (_sessions[msg.sender].sessionKey != sessionKey) {
                _sessions[msg.sender].sessionKey = sessionKey;

                _sessionOwners[sessionKey] = msg.sender;
            }

            emit SessionUpdated(
                msg.sender,
                _sessions[msg.sender].sessionKey,
                expirationTime
            );

            return SessionStatus.Updated;
        } else {
            _sessions[msg.sender] = Session({
                creator: address(msg.sender),
                sessionKey: sessionKey,
                expirationTime: expirationTime,
                txCount: 0
            });

            _sessionOwners[sessionKey] = msg.sender;

            emit SessionCreated(
                msg.sender,
                _sessions[msg.sender].sessionKey,
                expirationTime
            );
        }

        return SessionStatus.Created;
    }

    function endSession() external override nonReentrant {
        _validateSessionKey(_sessions[msg.sender].sessionKey);
        require(_sessions[msg.sender].expirationTime != 0, "LOP: IS");
        require(
            _sessions[msg.sender].expirationTime >= block.timestamp,
            "LOP: EXP"
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
            address taker,
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

    function _permit(bytes memory permitData) private {
        (address token, bytes memory permit) = abi.decode(
            permitData,
            (address, bytes)
        );
        token.uncheckedFunctionCall(
            abi.encodePacked(IERC20Permit.permit.selector, permit),
            "LOP: permit failed"
        );
    }

    function _validateSessionKey(address sessionKey) internal view {
        require(sessionKey != address(0), "LOP: A0");
        require(sessionKey != address(this), "LOP: AC");
        require(sessionKey != msg.sender, "LOP: AS");
    }

    function _hash(Order memory order) private view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        LIMIT_ORDER_TYPEHASH,
                        order.salt,
                        order.takerAsset,
                        order.makerAsset,
                        keccak256(order.takerAssetData),
                        keccak256(order.makerAssetData),
                        keccak256(order.getTakerAmount),
                        keccak256(order.getMakerAmount),
                        keccak256(order.predicate),
                        keccak256(order.permit),
                        keccak256(order.interaction)
                    )
                )
            );
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
        require(takerAssetData.length >= 100, "LOP: bad takerAssetData.length");
        require(makerAssetData.length >= 100, "LOP: bad makerAssetData.length");
        bytes4 takerSelector = takerAssetData.decodeSelector();
        bytes4 makerSelector = makerAssetData.decodeSelector();
        require(
            takerSelector >= IERC20.transferFrom.selector &&
                takerSelector <= _MAX_SELECTOR,
            "LOP: bad takerAssetData.selector"
        );
        require(
            makerSelector >= IERC20.transferFrom.selector &&
                makerSelector <= _MAX_SELECTOR,
            "LOP: bad makerAssetData.selector"
        );

        address taker = _sessions[
            address(takerAssetData.decodeAddress(_FROM_INDEX))
        ].sessionKey;
        if (
            (signature.length != 65 && signature.length != 64) ||
            SilentECDSA.recover(orderHash, signature) != taker
        ) {
            bytes memory result = taker.uncheckedFunctionStaticCall(
                abi.encodeWithSelector(
                    IERC1271.isValidSignature.selector,
                    orderHash,
                    signature
                ),
                "LOP: isValidSignature failed"
            );
            require(
                result.length == 32 &&
                    abi.decode(result, (bytes4)) ==
                    IERC1271.isValidSignature.selector,
                "LOP: bad signature"
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
                "LOP: private order"
            );
        }
        if (orderMakerAddress != maker) {
            takerAssetData.patchAddress(_TO_INDEX, _sessionOwners[msg.sender]);
        }

        // Patch taker amount
        takerAssetData.patchUint256(_AMOUNT_INDEX, takingAmount);

        require(
            takerAsset != address(0) &&
                takerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LOP: raw ETH is not supported"
        );

        // Transfer asset from taker to maker
        bytes memory result = takerAsset.uncheckedFunctionCall(
            takerAssetData,
            "LOP: takerAsset.call failed"
        );
        if (result.length > 0) {
            require(
                abi.decode(result, (bool)),
                "LOP: takerAsset.call bad result"
            );
        }
    }

    function _callMakerAssetTransferFrom(
        address makerAsset,
        bytes memory makerAssetData,
        uint256 makingAmount
    ) private {
        // Patch spender
        makerAssetData.patchAddress(_FROM_INDEX, _sessionOwners[msg.sender]);

        // Patch maker amount
        makerAssetData.patchUint256(_AMOUNT_INDEX, makingAmount);

        require(
            makerAsset != address(0) &&
                makerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LOP: raw ETH is not supported"
        );

        // Transfer asset from maker to taker
        bytes memory result = makerAsset.uncheckedFunctionCall(
            makerAssetData,
            "LOP: makerAsset.call failed"
        );
        if (result.length > 0) {
            require(
                abi.decode(result, (bool)),
                "LOP: makerAsset.call bad result"
            );
        }
    }

    function _updateSessionTransactions(
        bytes memory takerAssetData,
        bytes memory makerAssetData
    ) internal returns (uint256 txCountTaker, uint256 txCountMaker) {
        address orderTakerAddress = takerAssetData.decodeAddress(_TO_INDEX);
        require(orderTakerAddress != address(0), "LOP: OMA0");

        address orderMakerAddress = makerAssetData.decodeAddress(_TO_INDEX);
        require(orderMakerAddress != address(0), "LOP: OTA0");

        txCountTaker = ++_sessions[orderTakerAddress].txCount;
        txCountMaker = ++_sessions[orderMakerAddress].txCount;
    }

    function _callGetTakerAmount(Order memory order, uint256 makerAmount)
        private
        view
        returns (uint256 takerAmount)
    {
        if (
            order.getTakerAmount.length == 0 &&
            makerAmount == order.makerAssetData.decodeUint256(_AMOUNT_INDEX)
        ) {
            // On empty order.getTakerAmount calldata only whole fills are allowed
            return order.takerAssetData.decodeUint256(_AMOUNT_INDEX);
        }
        bytes memory result = address(this).uncheckedFunctionStaticCall(
            abi.encodePacked(order.getTakerAmount, makerAmount),
            "LOP: getTakerAmount call failed"
        );
        require(result.length == 32, "LOP: invalid getTakerAmount ret");
        return abi.decode(result, (uint256));
    }

    function _callGetMakerAmount(Order memory order, uint256 takerAmount)
        private
        view
        returns (uint256 makerAmount)
    {
        if (
            order.getMakerAmount.length == 0 &&
            takerAmount == order.takerAssetData.decodeUint256(_AMOUNT_INDEX)
        ) {
            // On empty order.getMakerAmount calldata only whole fills are allowed
            return order.makerAssetData.decodeUint256(_AMOUNT_INDEX);
        }
        bytes memory result = address(this).uncheckedFunctionStaticCall(
            abi.encodePacked(order.getMakerAmount, takerAmount),
            "LOP: getMakerAmount call failed"
        );
        require(result.length == 32, "LOP: invalid getMakerAmount ret");
        return abi.decode(result, (uint256));
    }

    function depositToken(address token, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(token != address(0), "LOP: 0TA");
        require(token != address(this), "LOP: ITA");
        require(amount > 0, "LOP: 0A");

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
        require(token != address(0), "LOP: 0TA");
        require(token != address(this), "LOP: ITA");
        require(_sessionOwners[msg.sender] == address(0), "LOP: SKW");
        require(amount > 0, "LOP: 0A");
        require(_balances[msg.sender][token].balance >= amount, "LOP: BNE");

        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.safeTransfer(msg.sender, amount);

        _balances[msg.sender][token].balance -= amount;

        return _balances[msg.sender][token].balance;
    }

    function balance(address token) external view override returns (uint256) {
        return _balances[msg.sender][token].balance;
    }
}
