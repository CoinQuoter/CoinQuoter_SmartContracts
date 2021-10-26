// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./interfaces/ILendingPool.sol";
import "./libraries/DataTypes.sol";

contract AAVEBridge is ReentrancyGuard, IPeripheryCallback {
    using SafeERC20 for IERC20;

    // No referral code provided
    uint16 private constant NO_REFERRAL = 0;

    // AAVE Lending pool interface
    ILendingPool private lendingPool;

    // Address of LLDEXProtcol contract
    address private lldexAddress;

    /// @notice Only original LLDEXProtocol can call IPeripheryCallback#lldexPeripheryCallback
    modifier verifyCallback() {
        require(lldexAddress == msg.sender, "AAVEBridge: invalid callback");

        _;
    }

    /// Payload data
    struct AAVECallbackData {
        address depositToken;
        address borrowToken;
        uint256 amountDeposit;
        uint256 amountBorrow;
    }

    constructor(address _poolAddress, address _lldexAddress) {
        lendingPool = ILendingPool(_poolAddress);
        lldexAddress = _lldexAddress;
    }

    function lldexPeripheryCallback(
        address maker,
        // solhint-disable-next-line no-unused-vars
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override verifyCallback returns (bytes memory result) {
        AAVECallbackData memory decodedPayload = abi.decode(payload, (AAVECallbackData));

        require(decodedPayload.borrowToken != address(0), "AAVEBridge: invalid borrow tkn");
        require(decodedPayload.depositToken != address(0), "AAVEBridge: invalid deposit tkn");

        depositAndBorrow(maker, decodedPayload);
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
}
