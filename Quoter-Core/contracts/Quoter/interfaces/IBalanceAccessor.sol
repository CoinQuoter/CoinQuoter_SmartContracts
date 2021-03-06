// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

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
     * @param token address of withdrawn token
     * @param amount withdraw amount
     * @param balance sender balance after withdraw
     */
    event TokenWithdrawn(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful transfer of token
     * @param from address of wallet transfering token
     * @param recipient address of token recipient
     * @param token address of transfered token
     * @param amount withdraw amount
     * @param balance from balance after transfer
     */
    event TokenTransfered(
        address indexed from,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful transfer of fee token - split between contract owner and frontend
     * @param from address of wallet that transfers token
     * @param recipient address of first recipient
     * @param splitTo address of second recipient
     * @param token address of deposited token
     * @param splitPercentage percentage used to split @amount between @recipient and @splitTo
     * @param amount deposit amount
     * @param balance from balance after fee token transfer
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
        uint256 balance;
    }

    /**
     * @notice Deposits given token of frontend to the Quoter smart contract and stores the balance information
     * @param token address of token to deposit, depositing wallet must give an allowance to the Quoter smart contract for given @amount
     * @param amount amount of tokens to deposit
     * @return balance after depositing the tokens
     */
    function depositToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws given token of frontend from the Quoter contract
     * @param token address of token to withdraw
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Returns balance of token available for use in Quoter
     * @param token address of token to check balance of
     * @return balance of given token
     */
    function balance(address token) external returns (uint256);
}
