// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import ".././interfaces/IRFQOrder.sol";

/// @title Callback for IRFQOrder#fillOrderRFQCallPeriphery
/// @notice Contract that calls IRFQOrder#fillOrderRFQCallPeriphery must implement this interface
interface IPeripheryCallback {
    /**
     * @notice Called to IPeripheryCallback(receiver).quoterPeripheryCallback after validating maker and taker session, order signature and transfering tokens from taker to maker
     * @dev The caller of this method must be checked to be QuoterProtocol
     * @param maker Address of the maker that fills the RFQOrder
     * @param info Info about the order containing token addresses and amounts
     * @param payload extra data passed through by the caller
     * @return Result data
     */
    function quoterPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external returns (bytes memory);
}
