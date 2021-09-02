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

    /**
     * @notice Emitted on successful session creation
     * @param sender address of account updating session
     * @param sessionKey public key of session
     */
    event SessionTerminated(address indexed sender, address indexed sessionKey);

    // Session status returned in createOrUpdateSession
    enum SessionStatus {
        Created,
        Updated
    }

    // Session data
    struct Session {
        // Address of creator
        address creator;
        // Public key of session
        address sessionKey;
        // Session expiration time (unix timestamp)
        uint256 expirationTime;
        // Number of transactions made in this session
        uint256 txCount;
    }

    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        returns (SessionStatus);

    function endSession() external;

    function sessionExpirationTime(address owner)
        external
        view
        returns (uint256 expirationTime);

    function session(address owner)
        external
        view
        returns (
            address creator,
            address sessionKey,
            uint256 expirationTime,
            uint256 txCount
        );
}
