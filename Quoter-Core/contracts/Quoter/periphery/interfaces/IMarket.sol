// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface IMarket {
    struct SupportedMarket {
        address marketAddress;
        uint8 selector;
    }
}