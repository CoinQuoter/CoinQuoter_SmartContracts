// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./libraries/DataTypes.sol";

contract AAVEBridge is ReentrancyGuard {
    ILendingPool private lendingPool;

    uint16 private constant NO_REEFERAL = 0;

    constructor(address poolAddress) {
        lendingPool = ILendingPool(poolAddress);
    }

    function depositAndBorrow(
        address maker,
        address depositToken,
        address borrowToken,
        uint256 amountDeposit,
        uint256 amountBorrow
    ) public nonReentrant {
        /// Deposit @amountDeposit of @depositToken to AAVE lending pool
        lendingPool.deposit(depositToken, amountDeposit, maker, NO_REEFERAL);

        /// And borrow @amountBorrow of @borrowToken from AAVE pool
        lendingPool.borrow(
            borrowToken,
            amountBorrow,
            //DataTypes.InterestRateMode.STABLE,
            NO_REEFERAL,
            maker
        );
    }
}
