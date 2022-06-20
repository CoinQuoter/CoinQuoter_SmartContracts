// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./interfaces/IAggregationRouterV4.sol";

import "./../helpers/MutableOwner.sol";
import "./libraries/DataTypes.sol";

contract ZeroExBridge is 
    ReentrancyGuard, 
    IPeripheryCallback,
    MutableOwner
{
    using SafeERC20 for IERC20;
    using Address for address;

    // Address of QouterProtocol contract
    address private quoterAddress;

    // Address of 0x Exchange contract
    address private zeroExProxyAddress;

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier verifyCallback() {
        require(quoterAddress == msg.sender, "0xBridge: invalid callback");

        _;
    }

    constructor(address _quoterAddress, address _zeroExProxyAddress, address owner) MutableOwner(owner) {
        quoterAddress = _quoterAddress;
        zeroExProxyAddress = _zeroExProxyAddress;
    }

    function quoterPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external override verifyCallback returns (bytes memory result) {
        (
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 amount, 
            bytes memory zxPayload
        ) = abi.decode(payload, (address, address, uint256, bytes));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "0xBridge: invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "0xBridge: invalid buyToken");
        require(amount == info.takingAmount || amount == info.makingAmount, "0xBridge: invalid amount");
        require(zxPayload.length != 0, "0xBridge: invalid zxPayload");

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(buyTokenAddress);

        // Calling router as bridge contract requires that the bridge has approved the router for the taking amount
        // (delegatecall could be used, but since QuoterProtocol uses session wallet, its not possible to call using master wallet)
        require(sellToken.approve(zeroExProxyAddress, amount), "0xBridge: approve failed");

        sellToken.safeTransferFrom(maker, address(this), amount);
        result = zeroExProxyAddress.functionCall(zxPayload);
        buyToken.safeTransfer(maker, buyToken.balanceOf(address(this)));
    }
}