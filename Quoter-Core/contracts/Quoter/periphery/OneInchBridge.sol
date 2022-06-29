// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./interfaces/IAggregationRouterV4.sol";

import "./../libraries/UncheckedAddress.sol";
import "./../helpers/MutableOwner.sol";
import "./libraries/DataTypes.sol";

contract OneInchBridge is 
    ReentrancyGuard, 
    IPeripheryCallback,
    MutableOwner
{
    using SafeERC20 for IERC20;
    using UncheckedAddress for address;

    // Address of QouterProtocol contract
    address private quoterAddress;

    // Address of 1Inch Protocol v4 contract
    address private oneInchAggregatorAddress;

    // 1Inch aggregation protocol
    IAggregationRouterV4 private oneInchProtocol;

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier verifyCallback() {
        require(quoterAddress == msg.sender, "1InchBridge: invalid callback");

        _;
    }

    constructor(address _quoterAddress, address _oneInchAggregatorAddress, address owner) MutableOwner(owner) {
        quoterAddress = _quoterAddress;
        oneInchAggregatorAddress = _oneInchAggregatorAddress;

        oneInchProtocol = IAggregationRouterV4(oneInchAggregatorAddress);
    }

    function quoterPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override verifyCallback returns (bytes memory result) {
        IERC20 tokenERC20 = IERC20(info.makerAsset);
        tokenERC20.safeTransferFrom(maker, address(this), info.makingAmount);
        result = oneInchAggregatorAddress.uncheckedFunctionCall(payload, "1InchBridge: call failed");

        if (result.length > 0) {
            require(abi.decode(result, (bool)), "1InchBridge: call bad result");
        }
    }

    function approve(address token) external onlyOwner{
        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.approve(oneInchAggregatorAddress, type(uint256).max);
    }
}
