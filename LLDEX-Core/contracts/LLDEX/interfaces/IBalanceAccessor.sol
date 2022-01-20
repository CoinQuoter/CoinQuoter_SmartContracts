// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBalanceAccessor {
    /**
     * @notice Emitted on successful deposit of token
     * @param sender address of wallet depositing token
     * @param token address of deposited token
     * @param amount deposit amount
     * @param balance sender balance after deposit
     */
    event TokenDeposited(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful withdrawn of token
     * @param sender address of wallet withdrawing token
     * @param token address of withdrawed token
     * @param amount withdraw amount
     * @param balance sender balance after withdraw
     */
    event TokenWithdrawed(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful withdrawn of token
     * @param from address of wallet withdrawing token
     * @param recipient address of token recipient
     * @param token address of withdrawed token
     * @param amount withdraw amount
     * @param balance sender balance after withdraw
     */
    event TokenTransfered(
        address indexed from,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful withdrawn of token - split between taker and frontend
     * @param from address of wallet that transfers token
     * @param recipient address of first recipient
     * @param splitTo address of second recipient
     * @param token address of deposited token
     * @param splitPercentage percentage used to split @amount between @recipient and @splitTo
     * @param amount deposit amount
     * @param balance sender balance after deposit
     */
    event SplitTokenTransfered(
        address indexed from,
        address indexed recipient,
        address indexed splitTo,
        address token, // Due to limitations only three event's arguments can be indexed
        uint256 splitPercentage,
        uint256 amount,
        uint256 balance
    );

    // Balance data
    struct Balance {
        // Balance in LLDEX token
        uint256 balance;
    }

    /**
     * @notice Deposits given token of frontend to the LLDEX contract and stores the balance information
     * @param token address of token to deposit, depositing wallet must give an allowance to the LLDEX contract for given @amount
     * @param amount amount of tokens to deposit
     * @return balance after depositing the tokens
     */
    function depositToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws given token of frontend from the LLDEX contract
     * @param token address of token to withdraw
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Returns balance of token available for use in LLDEX
     * @param token address of token to check balance of
     * @return balance of given token
     */
    function balance(address token) external returns (uint256);
}
