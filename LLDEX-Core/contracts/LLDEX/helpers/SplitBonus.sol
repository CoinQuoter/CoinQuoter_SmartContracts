// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FullMath.sol";
import "./MutableOwner.sol";

contract SplitBonus is FullMath {
    // solhint-disable var-name-mixedcase
    uint256 private _SPLIT_BONUS = 0;
    uint256 private _SPLIT_SCALE = 0;

    uint256 private constant _SPLIT_SCALE_MIN = 100;
    uint256 private constant _SPLIT_SCALE_MAX = 100000;

    constructor(uint256 splitBonus, uint256 splitScale) {
        require(splitScale >= _SPLIT_SCALE_MIN, "SB: Scale too low");
        require(splitScale <= _SPLIT_SCALE_MAX, "SB: Scale too high");
        require(splitBonus <= splitScale, "SB: Invalid bonus value");

        _SPLIT_BONUS = splitBonus;
        _SPLIT_SCALE = splitScale;
    }

    function _calculateBonus(uint256 amount) internal view returns(uint256 bonusAmount, uint256 amountLeft) {
        bonusAmount = FullMath.mulDiv(amount, _SPLIT_BONUS, _SPLIT_SCALE);
        amountLeft = amount - bonusAmount;
    }

    function getSplitBonus() public view returns (uint256 bonus) {
        return _SPLIT_BONUS;
    }

    function getSplitScale() public view returns (uint256 scale) {
        return _SPLIT_SCALE;
    }

    function _setSplitBonus(uint256 amount) internal {
        require(amount <= _SPLIT_SCALE, "SB: Invalid bonus value");
        
        _SPLIT_BONUS = amount;
    }
}