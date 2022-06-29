// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import ".././interfaces/IPeripheryCallback.sol";
import "./../helpers/MutableOwner.sol";

import "./interfaces/IDfxFinanceRouter.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IMarket.sol";

contract CoreRouter is 
    ReentrancyGuard, 
    IPeripheryCallback,
    MutableOwner
{
    using SafeERC20 for IERC20;
    using Address for address;

    uint8 private constant _SELECTOR_FROM = _SELECTOR_ZERO_EX;

    uint8 private constant _SELECTOR_COMMON = 1;
    uint8 private constant _SELECTOR_ZERO_EX = 2;
    uint8 private constant _SELECTOR_DFX_FINANCE = 3;
    uint8 private constant _SELECTOR_UNISWAP = 4;
    uint8 private constant _SELECTOR_SUSHISWAP = 5;

    uint8 private constant _SELECTOR_TO = _SELECTOR_SUSHISWAP;

    // Address of QouterProtocol contract
    address private quoterAddress;

    // Mapping of supported markets by this smart contract
    mapping(uint8 => address) private supportedMarkets;

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier verifyCallback() {
        require(quoterAddress == msg.sender, "CoreRouter: invalid callback");

        _;
    }

    /// @notice Only original QuoterProtocol can call IPeripheryCallback#quoterPeripheryCallback
    modifier supported(bytes memory payload) {
        (uint8 selector) = abi.decode(payload, (uint8));
        require(supportedMarkets[selector] != address(0) || selector == _SELECTOR_COMMON, "CoreRouter: unsupported selector");

        _;
    }

    constructor(
        address _quoterAddress, 
        address owner
    ) MutableOwner(owner) {
        quoterAddress = _quoterAddress;
    }

    function quoterPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) 
        external override 
        verifyCallback 
        supported(payload) 
        returns (bytes memory result) 
    {
        (uint8 selector) = abi.decode(payload, (uint8));

        if (selector == _SELECTOR_ZERO_EX) {
            return tradeB2BZeroEx(maker, info, payload);
        }

        if (selector == _SELECTOR_DFX_FINANCE) {
            tradeB2BDfxFinance(maker, info, payload);
        }

        if (selector == _SELECTOR_UNISWAP) {
            tradeB2BUniswap(maker, info, payload);
        }

        if (selector == _SELECTOR_SUSHISWAP) {
            tradeB2BSushiSwap(maker, info, payload);
        }

        if (selector == _SELECTOR_COMMON) {
            tradeB2BCommon(maker, info, payload);
        }
    }

    function tradeB2BZeroEx(
        address maker, 
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) internal returns (bytes memory result) {
        (
            ,
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 amount, 
            bytes memory zxPayload
        ) = abi.decode(payload, (uint8, address, address, uint256, bytes));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "cr0xBridge: invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "cr0xBridge: invalid buyToken");
        require(amount == info.takingAmount || amount == info.makingAmount, "cr0xBridge: invalid amount");
        require(zxPayload.length != 0, "cr0xBridge: invalid zxPayload");

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(buyTokenAddress);
        address zeroExProxyAddress = supportedMarkets[_SELECTOR_ZERO_EX];

        // Calling router as bridge contract requires that the bridge has approved the router for the taking amount
        require(sellToken.approve(zeroExProxyAddress, amount), "cr0xBridge: approve failed");

        sellToken.safeTransferFrom(maker, address(this), amount);
        result = zeroExProxyAddress.functionCall(zxPayload);
        buyToken.safeTransfer(maker, buyToken.balanceOf(address(this)));
    }

    function tradeB2BDfxFinance(
        address maker, 
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) internal {
        (
            ,
            address usdcTokenAddress,
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 sellAmount,
            uint256 buyAmount
        ) = abi.decode(payload, (uint8, address, address, address, uint256, uint256));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "crDfxRouter: invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "crDfxRouter: invalid buyToken");
        require(sellAmount == info.takingAmount || sellAmount == info.makingAmount, "crDfxRouter: invalid amount");

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(buyTokenAddress);
        IDfxFinanceRouter dfxRouter = IDfxFinanceRouter(supportedMarkets[_SELECTOR_DFX_FINANCE]);

        // Calling router as bridge contract requires that the bridge has approved the router for the taking amount
        require(sellToken.approve(address(dfxRouter), sellAmount), "crDfxRouter: approve failed");

        sellToken.safeTransferFrom(maker, address(this), sellAmount);
        dfxRouter.originSwap(
            usdcTokenAddress, 
            sellTokenAddress, 
            buyTokenAddress, 
            sellAmount, 
            buyAmount, 
            block.timestamp + 1 minutes
        );
        buyToken.safeTransfer(maker, buyToken.balanceOf(address(this)));
    }

    function tradeB2BUniswap(
        address maker, 
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) internal {
        (
            ,
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 sellAmount,
            uint256 buyAmount,
            uint24 feePool
        ) = abi.decode(payload, (uint8, address, address, uint256, uint256, uint24));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "crUniswap: invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "crUniswap: invalid buyToken");
        require(sellAmount == info.takingAmount || sellAmount == info.makingAmount, "crUniswap: invalid amount");

        IERC20 sellToken = IERC20(sellTokenAddress);
        ISwapRouter uniswapRouter = ISwapRouter(supportedMarkets[_SELECTOR_UNISWAP]);

        // Calling router as bridge contract requires that the bridge has approved the router for the taking amount
        require(sellToken.approve(address(uniswapRouter), sellAmount), "crUniswap: approve failed");

        sellToken.safeTransferFrom(maker, address(this), sellAmount);
        ISwapRouter.ExactInputSingleParams memory params = 
            ISwapRouter.ExactInputSingleParams({
                tokenIn: sellTokenAddress,
                tokenOut: buyTokenAddress,
                fee: feePool,
                recipient: maker,
                deadline: block.timestamp,
                amountIn: sellAmount,
                amountOutMinimum: buyAmount,
                sqrtPriceLimitX96: 0
            });
        uniswapRouter.exactInputSingle(params);
    }

    function tradeB2BSushiSwap(
        address maker, 
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) internal {
        (
            ,
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 sellAmount,
            uint256 buyAmount
        ) = abi.decode(payload, (uint8, address, address, uint256, uint256));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "crSushiswap: invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "crSushiswap: invalid buyToken");
        require(sellAmount == info.takingAmount || sellAmount == info.makingAmount, "crSushiswap: invalid amount");

        IERC20 sellToken = IERC20(sellTokenAddress);
        IUniswapV2Router01 sushiRouter = IUniswapV2Router01(supportedMarkets[_SELECTOR_SUSHISWAP]);

        // Calling router as bridge contract requires that the bridge has approved the router for the taking amount
        require(sellToken.approve(address(sushiRouter), sellAmount), "crSushiswap: approve failed");
        sellToken.safeTransferFrom(maker, address(this), sellAmount);

        address[] memory path = new address[](2);
        path[0] = sellTokenAddress;
        path[1] = buyTokenAddress;

        sushiRouter.swapExactTokensForTokens(
            sellAmount,
            buyAmount,
            path,
            maker,
            block.timestamp
        );
    }

    function tradeB2BCommon(
        address maker, 
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) internal {
        (
            ,
            address sellTokenAddress, 
            address buyTokenAddress, 
            uint256 sellAmount,
            address to,
            bytes memory data
        ) = abi.decode(payload, (uint8, address, address, uint256, address, bytes));

        require(sellTokenAddress == info.makerAsset || sellTokenAddress == info.takerAsset, "crCommon invalid sellToken");
        require(buyTokenAddress == info.makerAsset || buyTokenAddress == info.takerAsset, "crCommon: invalid buyToken");
        require(sellAmount == info.takingAmount || sellAmount == info.makingAmount, "crCommon: invalid amount");

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(buyTokenAddress);

        require(sellToken.approve(address(to), sellAmount), "crCommon: approve failed");

        sellToken.safeTransferFrom(maker, address(this), sellAmount);
        to.functionCall(data);
        buyToken.safeTransfer(maker, buyToken.balanceOf(address(this)));
    }
    
    function emergencyTransfer(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);

        token.safeTransfer(mutableOwner(), token.balanceOf(address(this)));
    }

    function transferOwnership(address to)
        external
        onlyOwner
        returns (address oldOwner, address newOwner)
    {
        _validateTo(to);
        _mutateOwner(to);
        return (msg.sender, to);
    }

    function _validateTo(address to) internal view {
        require(to != address(0), "CoreRouter: invalid to address 0x1");
        require(to != address(this), "CoreRouter: invalid to address 0x2");
        require(to != msg.sender, "CoreRouter: invalid to address 0x3");
    }

    function addMarket(IMarket.SupportedMarket calldata market) public onlyOwner{
        require(market.selector >= _SELECTOR_FROM && market.selector <= _SELECTOR_TO, "CoreRouter: invalid selector");
        require(market.marketAddress != address(this), "CoreRouter: invalid address");

        supportedMarkets[market.selector] = market.marketAddress;
    }
}