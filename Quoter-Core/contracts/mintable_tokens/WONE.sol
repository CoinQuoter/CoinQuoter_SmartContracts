// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
pragma solidity ^0.8.1;

contract WONEToken is ERC20PresetMinterPauser {
    uint8 private _decimals;

    constructor() ERC20PresetMinterPauser("Wrapped ONE", "WONE") {
        _decimals = 18;
        _mint(msg.sender, 5000000000000000000000000000000000);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
