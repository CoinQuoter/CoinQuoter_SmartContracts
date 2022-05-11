// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
pragma solidity ^0.8.1;

contract WBTCToken is ERC20PresetMinterPauser {
    uint8 private _decimals;

    constructor() ERC20PresetMinterPauser("Wrapped Bitcoin", "WBTC") {
        _decimals = 8;
        _mint(msg.sender, 500000000000000000000);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
