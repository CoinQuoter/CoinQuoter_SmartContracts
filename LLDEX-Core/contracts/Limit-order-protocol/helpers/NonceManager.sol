// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @title A helper contract for managing nonce of tx sender
contract NonceManager {
    event NonceIncreased(address indexed taker, uint256 newNonce);

    mapping(address => uint256) public nonce;

    /// @notice Advances nonce by one
    function increaseNonce() external {
        advanceNonce(1);
    }

    function advanceNonce(uint8 amount) public {
        emit NonceIncreased(msg.sender, nonce[msg.sender] += amount);
    }

    function nonceEquals(address takerAddress, uint256 takerNonce)
        external
        view
        returns (bool)
    {
        return nonce[takerAddress] == takerNonce;
    }
}
