// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface IPenaltyManager {
    /**
     * @notice Emitted on successful deposit of LLDEX token
     * @param sender address of wallet depositing token
     * @param amount deposit amount
     * @param balance sender balance after deposit
     */
    event TokenDeposited(
        address indexed sender,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful withdrawn of LLDEX token
     * @param sender address of wallet withdrawing token
     * @param amount withdraw amount
     * @param balance sender balance after withdraw
     */
    event TokenWithdrawed(
        address indexed sender,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful balance transfer from @from to @to
     * @param from address of wallet transfering balance to @to
     * @param to address of wallet receiving balance
     * @param amount amount of balance transfered
     */
    event BalanceTransfered(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /**
     * @notice Emitted on penalty issued by collector
     * @param receiver address of wallet that received penalty
     * @param amount penalty amount
     * @param balance balance after penalty
     */
    event PenaltyIssued(
        address indexed receiver,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on penalty issued by collector
     * @param receiver address of wallet that received penalty
     * @param splitTo address of wallet that received penalty
     * @param splitPercentage split percentage, i.e. how much should go to @splitTo address and to PM owner address
     * @param amount penalty amount
     * @param balance balance after penalty
     */
    event SplitPenaltyIssued(
        address indexed receiver,
        address indexed splitTo,
        uint256 splitPercentage,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Deposits LLDEX token to penalty manager
     * @param amount amount of tokens to deposit
     * @return balance after depositing the tokens
     */
    function depositToken(uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws LLDEX token from penalty manager to msg.sender
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawToken(uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws LLDEX token from penalty manager to @to
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawTokenTo(address to, uint256 amount) external returns (uint256);

    /**
     * @notice Transfers @amount of balance of msg.sender to @to address
     * @param to address of sender's balance recipient
     * @param amount amount of tokens to transfer
     * @return balanceSender sender balance after transfer
     * @return balanceRecipient recipient balance after transfer
     */
    function transferTo(address to, uint256 amount) external returns (uint256 balanceSender, uint256 balanceRecipient);

    /**
     * @notice Transfers @amount of balance of @to address to PM owner
     * @param to penalized maker address
     * @param amount penalty amount
     * @return balance of @to after penalty
     */
    function issuePenalty(address to, uint256 amount) external returns (uint256);

    /**
     * @notice Transfers @amount of balance of @to address to PM owner and to split
     * @param to penalized maker address
     * @param splitRecipient secondary wallet that should receive some amount of @amount based on current split percentage of PM
     * @param amount penalty amount
     * @return balance of @to after penalty
     */
    function issuePenaltySplit(address to, address splitRecipient, uint256 amount) external returns (uint256);

    /**
     * @notice Adds new address that can issue penalties to makers
     * @param collector new collector address
     */
    function addCollector(address collector) external;

    /**
     * @notice Removes collector, @collector address will not be able to issue penalties anymore
     * @param collector address to remove
     */
    function removeCollector(address collector) external;

    /**
     * @notice Checks if given address is collector
     * @param addr address to check
     */
    function isCollector(address addr) external returns(bool);

    /**
     * @notice Returns balance of LLDEX token available for use as penalty
     * @param addr address of wallet to check balance of
     * @return balance of given token
     */
    function balanceOf(address addr) external returns (uint256);

    /**
     * @notice Transfers ownership of penalty manager to @to address
     * @dev Transfers balance of previous owner to new owner
     * @param to address of wallet that will receive ownership
     * @return oldOwner address of previous owner
     * @return newOwner address of new owner
     */
    function transferOwnership(address to) external returns (address oldOwner, address newOwner);
}
