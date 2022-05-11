// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface ITradingSession {
    /**
     * @notice Emitted on successful session creation
     * @param creator address of wallet creating session
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
     * @param sender address of wallet updating session
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
     * @param sender address of wallet updating session
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

    /**
     * @notice Creates or updates session that lets maker and taker to trade without signing messages through wallet, ie. Metamask
     * @param sessionKey public key of session
     * @param expirationTime expiration time in unix seconds timestamp
     * @return session status, either Created or Updated
     */
    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        returns (SessionStatus);

    /**
     * @notice Terminates active session
     * @dev sets session expiration timestamp to zero
     */
    function endSession() external;

    /**
     * @notice Returns expiration unix timestamp of @owner session
     * @param owner owner of the session
     * @return expirationTime - unix expiration timestamp in seconds
     */
    function sessionExpirationTime(address owner)
        external
        view
        returns (uint256 expirationTime);

    /**
     * @notice Returns session data
     * @param owner owner of the session
     * @return creator - session creator, owner
     * @return sessionKey - session public key
     * @return expirationTime - session expiration unix timestamp, might be zero if it was terminated
     * @return txCount - number of transactions made during session
     */
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
