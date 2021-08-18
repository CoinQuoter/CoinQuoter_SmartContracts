// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ITradingSession {
    /**
     * @notice Emitted on successful session creation
     * @param creator address of account creating session
     * @param sessionKey public key of session
     * @param expirationTime session expiration time
     */
    event SessionCreated(
        address indexed creator,
        address indexed sessionKey,
        uint256 expirationTime
    );

    /**
     * @notice Emitted on successful session creation
     * @param sender address of account updating session
     * @param sessionKey public key of session
     * @param expirationTime session expiration time
     */
    event SessionUpdated(
        address indexed sender,
        address indexed sessionKey,
        uint256 expirationTime
    );

    // details about the taker - maker session
    struct Session {
        // Address of maker
        address maker;
        // Public key of session
        address sessionKey;
        // Session expiration time (unix timestamp)
        uint256 expirationTime;
        // Number of transactions made in this session
        uint256 txCount;
    }

    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        returns (int256);

    function endSession(address sessionKey) external;

    function sessionExpirationTime(address creator, address sessionKey)
        external
        view
        returns (uint256 expirationTime);

    function sessionValid(address creator, address sessionKey)
        external
        view
        returns (bool valid);
}
