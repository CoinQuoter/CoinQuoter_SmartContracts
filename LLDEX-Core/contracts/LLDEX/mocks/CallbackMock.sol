// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import ".././interfaces/IPeripheryCallback.sol";

contract CallbackMock is IPeripheryCallback {
    /// Payload mock data
    struct MockPayload {
        address mockAddress;
        uint256 mockData;
    }

    event MockCallbackReceived(address mockAddress, uint256 mockData);

    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    function lldexPeripheryCallback(
        // solhint-disable-next-line no-unused-vars
        address maker,
        // solhint-disable-next-line no-unused-vars
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    )
        external
        override
        returns (
            // solhint-disable-next-line no-unused-vars
            bytes memory result
        )
    {
        MockPayload memory decodedPayload = abi.decode(payload, (MockPayload));

        emit MockCallbackReceived(decodedPayload.mockAddress, decodedPayload.mockData + 1);
    }
}
