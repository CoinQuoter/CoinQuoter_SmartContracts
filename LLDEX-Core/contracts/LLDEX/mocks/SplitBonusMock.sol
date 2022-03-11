// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import ".././interfaces/IPeripheryCallback.sol";
import ".././helpers/SplitBonus.sol";

contract SplitBonusMock is SplitBonus {
    constructor(uint256 percentage, uint256 scale) SplitBonus(percentage, scale) {}

    function setSplitBonus(uint256 bonus)
        external
    {
        SplitBonus._setSplitBonus(bonus);
    }
}
