// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBalanceAccessor {
    /**
     * @notice Emitted on successful deposit of currency token
     * @param sender address of account depositing token
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

    // Balance data (so far only balance is included)
    struct Balance {
        // Balance in LLDEX token
        uint256 balance;
    }

    /**
     * @notice Deposits given token of frontend to the LOP contract and stores the balance information
     * @param token address of token to deposit, depositing account must give an allowance to the LOP contract for given @amount
     * @param amount amount of tokens to deposit
     * @return balance after depositing the tokens
     */
    function depositToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws given token of frontend from the LOP contract
     * @param token address of token to withdraw
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Returns balance of token available for use in LOP
     * @param token address of token to withdraw
     * @return balance of given token
     */
    function balance(address token) external returns (uint256);
}
