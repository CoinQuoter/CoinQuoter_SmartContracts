// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./libraries/DataTypes.sol";

contract AAVEBridge is ReentrancyGuard, IPeripheryCallback {
    using SafeERC20 for IERC20;

    // No referral code provided
    uint16 private constant NO_REFERRAL = 0;

    bytes32 private constant DATA_PROVIDER_ID = "0x1";

    // AAVE Lending pool interface
    ILendingPool private lendingPool;

    // AAVE data provider
    IProtocolDataProvider private dataProvider;

    // Address of QouterProtcol contract
    address private quoterAddress;

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier verifyCallback() {
        require(quoterAddress == msg.sender, "AAVEBridge: invalid callback");

        _;
    }

    /// Payload data
    struct AAVECallbackData {
        address depositToken;
        address borrowToken;
        uint256 amountDeposit;
        uint256 amountBorrow;
    }

    struct AAVECallbackDataRepay {
        address repayToken;
        address withdrawToken;
        address withdrawaToken;
        uint256 amountRepay;
        uint256 amountWithdraw;
    }

    constructor(address _poolAddress, address _quoterAddress) {
        lendingPool = ILendingPool(_poolAddress);
        dataProvider = IProtocolDataProvider(
            lendingPool.getAddressesProvider().getAddress(DATA_PROVIDER_ID)
        );
        quoterAddress = _quoterAddress;
    }

    function quoterPeripheryCallback(
        address maker,
        // solhint-disable-next-line no-unused-vars
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override verifyCallback returns (bytes memory result) {
        // uint8 _selector = abi.decode(payload, (uint8));

        // if (_selector == 1) {
        //     AAVECallbackData memory decodedPayload = abi.decode(
        //         _clearSelector(payload),
        //         (AAVECallbackData)
        //     );

        //     require(decodedPayload.borrowToken != address(0), "AAVEBridge: invalid borrow");
        //     require(decodedPayload.depositToken != address(0), "AAVEBridge: invalid deposit");

        //     depositAndBorrow(maker, decodedPayload);
        // } else if (_selector == 2) {
        AAVECallbackDataRepay memory decodedPayload = abi.decode(
            payload,
            (AAVECallbackDataRepay)
        );

        require(decodedPayload.withdrawToken != address(0), "AAVEBridge: invalid withdraw");
        require(decodedPayload.repayToken != address(0), "AAVEBridge: invalid repay");

        repayAndWithdraw(maker, decodedPayload);
        // } else {
        //     revert("AAVEBridge: Invalid selector");
        // }
    }

    function _clearSelector(bytes memory data) internal pure returns (bytes memory result) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            result := mload(add(data, 0x21))
        }
    }

    function depositAndBorrow(address maker, AAVECallbackData memory data)
        internal
        nonReentrant
    {
        // Transfer @depositToken from maker to AAVE bridge (maker must approve bridge to use his tokens)
        IERC20(data.depositToken).safeTransferFrom(maker, address(this), data.amountDeposit);
        // Approve AAVE Lending pool to use up to @amountDeposit of bridge @depositToken
        IERC20(data.depositToken).approve(address(lendingPool), data.amountDeposit);

        // Deposit @amountDeposit of @depositToken to AAVE lending pool
        lendingPool.deposit(data.depositToken, data.amountDeposit, maker, NO_REFERRAL);

        // And borrow @amountBorrow of @borrowToken from AAVE pool
        lendingPool.borrow(
            data.borrowToken,
            data.amountBorrow,
            uint256(DataTypes.InterestRateMode.VARIABLE), // Borrow with variable interest rate
            NO_REFERRAL,
            maker
        );

        // Transfer @borrowToken from bridge back to to maker
        IERC20(data.borrowToken).safeTransfer(maker, data.amountBorrow);
    }

    function repayAndWithdraw(address maker, AAVECallbackDataRepay memory data)
        internal
        nonReentrant
    {
        // Transfer @repayToken from maker to AAVE bridge (maker must approve bridge to use his tokens)
        IERC20(data.repayToken).safeTransferFrom(maker, address(this), data.amountRepay);
        // Approve AAVE Lending pool to use up to @amountRepay of bridge @depositToken
        IERC20(data.repayToken).approve(address(lendingPool), data.amountRepay);

        // Repay @amountDeposit of @repayToken to AAVE lending pool
        lendingPool.repay(
            data.repayToken,
            data.amountRepay,
            uint256(DataTypes.InterestRateMode.VARIABLE),
            maker
        );

        // Withdraw aTokens from maker
        IERC20(data.withdrawaToken).safeTransferFrom(
            maker,
            address(this),
            data.amountWithdraw
        );

        // And withdraw @amountWithdraw of @withdrawToken from AAVE pool
        lendingPool.withdraw(data.withdrawToken, data.amountWithdraw, maker);

        // // Transfer @withdrawToken from bridge back to to maker
        // IERC20(data.withdrawToken).safeTransfer(maker, data.amountWithdraw);
    }

    function _getaToken(address asset) internal view returns (address aTokenAddress) {
        (aTokenAddress, , ) = dataProvider.getReserveTokensAddresses(asset);
    }

    function _getStableDebtToken(address asset)
        internal
        view
        returns (address stableDebtTokenAddress)
    {
        (, stableDebtTokenAddress, ) = dataProvider.getReserveTokensAddresses(asset);
    }

    function _getVariableDebtToken(address asset)
        internal
        view
        returns (address variableDebtTokenAddress)
    {
        (, , variableDebtTokenAddress) = dataProvider.getReserveTokensAddresses(asset);
    }
}
