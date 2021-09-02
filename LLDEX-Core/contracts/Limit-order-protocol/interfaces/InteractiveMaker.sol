// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface InteractiveMaker {
    function notifyFillOrder(
        address takerAsset,
        address makerAsset,
        uint256 takingAmount,
        uint256 makingAmount,
        bytes memory interactiveData
    ) external;
}
