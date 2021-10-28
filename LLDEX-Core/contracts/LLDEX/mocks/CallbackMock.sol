// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import ".././interfaces/IPeripheryCallback.sol";

contract CallbackMock is IPeripheryCallback{
    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    function lldexPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override returns (bytes memory result)     
    // solhint-disable-next-line no-empty-blocks
    {

    }
}
