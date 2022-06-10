// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./interfaces/IAggregationRouterV4.sol";

import "./libraries/DataTypes.sol";

contract OneInchBridge is ReentrancyGuard, IPeripheryCallback {
    using SafeERC20 for IERC20;

    // Address of QouterProtocol contract
    address private quoterAddress;

    // Address of 1Inch Aggregator OneSplitAudit contract
    address private oneInchAggregatorAddress;

    // 1Inch aggregation protocol
    IAggregationRouterV4 private oneInchProtocol;

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier verifyCallback() {
        require(quoterAddress == msg.sender, "1InchBridge: invalid callback");

        _;
    }

    constructor(address _quoterAddress, address _oneInchAggregatorAddress) {
        quoterAddress = _quoterAddress;
        oneInchAggregatorAddress = _oneInchAggregatorAddress;

        oneInchProtocol = IAggregationRouterV4(oneInchAggregatorAddress);
    }

    function quoterPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override verifyCallback returns (bytes memory result) {
        (bool success, bytes memory returnData) = oneInchAggregatorAddress.call(payload);
        require(success, "1InchBridge: call failed");

        result = returnData;
    }
}
