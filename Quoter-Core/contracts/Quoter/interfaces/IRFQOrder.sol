// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface IRFQOrder {
    event OrderFilledRFQ(bytes32 orderHash, uint256 takingAmount, uint256 makingAmount);

    struct OrderRFQ {
        uint256 info;
        uint256 feeAmount;
        address takerAsset;
        address makerAsset;
        address feeTokenAddress;
        address frontendAddress;
        bytes takerAssetData;
        bytes makerAssetData;
    }

    struct OrderRFQAmounts {
        uint256 takingAmount;
        uint256 makingAmount;
    }

    struct OrderRFQCallbackInfo {
        address takerAsset;
        address makerAsset;
        uint256 takingAmount;
        uint256 makingAmount;
    }

    /// @notice Cancels order's quote
    /// @param orderInfo order info containing timestamp and order id
    function cancelOrderRFQ(uint256 orderInfo) external;

    /// @notice Fills order's quote, fully or partially (whichever is possible)
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    /// @return amounts - filled taking and making amounts
    function fillOrderRFQ(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    ) external returns (OrderRFQAmounts memory amounts);

    /// @notice Fills order's quote, fully or partially (whichever is possible) and calls external contract function
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    /// @param receiver Address of contract that will receive the call after successful validation of RFQ order and transfer from taker to maker
    /// @param data external call data
    /// @return amounts - filled taking and making amounts
    function fillOrderRFQCallPeriphery(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address receiver,
        bytes calldata data
    ) external returns (OrderRFQAmounts memory amounts, bytes memory result);
}
