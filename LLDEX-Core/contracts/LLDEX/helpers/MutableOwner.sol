// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @title A helper contract with helper modifiers to allow access to current contract owner and change the owner
contract MutableOwner {
    address private _mutableOwner;

    modifier onlyOwner() {
        require(msg.sender == _mutableOwner, "MO: Access denied");
        _;
    }

    constructor(address _owner) {
        _mutableOwner = _owner;
    }
    
    function _mutateOwner(address owner) internal onlyOwner {
        _mutableOwner = owner;
    }

    function mutableOwner() public view returns(address) {
        return _mutableOwner;
    }
}
