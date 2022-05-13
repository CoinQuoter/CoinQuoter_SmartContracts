// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
pragma solidity ^0.8.1;

contract QuoterToken is ERC20 {
    uint8 private _decimals;

    constructor(address mintTo) ERC20("Quoter Token", "QTR") {
        _mint(mintTo, 5000000000000000000000000000000000);
        _decimals = 18;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
