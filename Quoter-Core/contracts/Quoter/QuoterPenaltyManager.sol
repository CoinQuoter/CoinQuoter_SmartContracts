// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./helpers/MutableOwner.sol";
import "./helpers/SplitBonus.sol";
import "./interfaces/IPenaltyManager.sol";

// @title Quoter Penalty Manager v1
contract QuoterPenaltyManager is 
    MutableOwner, 
    SplitBonus,
    ReentrancyGuard, 
    IPenaltyManager 
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Quoter token
    IERC20 private _quoterToken;

    // Mapping of balance owner (maker, admin) to amount
    mapping(address => uint256) private _balances;

    // Mapping of addresses that are allowed to issue penalties to makers
    mapping(address => bool) private _collectors;

    modifier collectorOnly() {
        require(_collectors[msg.sender], "QUOTER-PM: not collector");

        _;
    }

    constructor(
        address quoterAddress, 
        uint256 splitBonus, 
        address owner
    ) MutableOwner(owner) SplitBonus(splitBonus, 100)  {
        require(quoterAddress != address(0), "QUOTER-PM: 0 Quoter address");

        _quoterToken = IERC20(quoterAddress);
    }

    function depositToken(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "QUOTER-PM: amount is 0");

        _quoterToken.safeTransferFrom(msg.sender, address(this), amount);
        _balances[msg.sender] += amount;

        emit TokenDeposited(msg.sender, amount, _balances[msg.sender]);

        return _balances[msg.sender];
    }

    function withdrawToken(uint256 amount) external override nonReentrant returns (uint256) {
        _withdrawTransferTo(msg.sender, amount);

        emit TokenWithdrawn(msg.sender, amount, _balances[msg.sender]);
        return _balances[msg.sender];
    }

    function withdrawTokenTo(address to, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        _withdrawTransferTo(to, amount);

        emit TokenWithdrawn(msg.sender, amount, _balances[msg.sender]);
        return _balances[msg.sender];
    }

    function transferTo(address to, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256 balanceSender, uint256 balanceRecipient)
    {
        _validateTo(to);

        require(amount > 0, "QUOTER-PM: amount is 0");
        require(_balances[msg.sender] >= amount, "QUOTER-PM: insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit BalanceTransfered(
            msg.sender, 
            to, 
            amount, 
            _balances[msg.sender], 
            _balances[to]
        );
        return (_balances[msg.sender], _balances[to]);
    }

    function issuePenalty(address to, uint256 amount)
        external
        override
        nonReentrant
        collectorOnly
        returns (uint256)
    {
        _validateTo(to);

        require(amount > 0, "QUOTER-PM: amount is 0");
        require(_balances[to] >= amount, "QUOTER-PM: insufficient balance");

        _balances[to] -= amount;
        _balances[mutableOwner()] += amount;

        emit PenaltyIssued(to, amount, _balances[to]);
        return _balances[to];
    }

    function issuePenaltySplit(address to, address splitRecipient, uint256 amount)
        external
        override
        nonReentrant
        collectorOnly
        returns (uint256)
    {
        _validateTo(to);
        _validateSR(splitRecipient);

        require(amount > 0, "QUOTER-PM: amount is 0");
        require(to != splitRecipient, "QUOTER-PM: invalid sr address 0x4");
        require(_balances[to] >= amount, "QUOTER-PM: insufficient balance");

        _balances[to] -= amount;
         if (SplitBonus.getSplitBonus() > 0) {
            (uint256 bonusAmount, uint256 amountLeft) = SplitBonus._calculateBonus(amount);

            _balances[mutableOwner()] += amountLeft;
            _balances[splitRecipient] += bonusAmount;

            emit SplitPenaltyIssued(to, splitRecipient, SplitBonus.getSplitBonus(), amount, _balances[to]);
        } else {
            _balances[mutableOwner()] += amount;

            emit PenaltyIssued(to, amount, _balances[to]);
        }

        return _balances[to];
    }

    function addCollector(address collector) external override onlyOwner {
        require(collector != address(0), "QUOTER-PM: invalid address 0x1");

        _collectors[collector] = true;
    }

    function removeCollector(address collector) external override onlyOwner {
        require(collector != address(0), "QUOTER-PM: invalid address 0x1");

        _collectors[collector] = false;
    }

    function isCollector(address addr) external override view returns(bool) {
        return _collectors[addr];
    }

    function balanceOf(address addr) external view override returns (uint256) {
        return _balances[addr];
    }

    function transferOwnership(address to)
        external
        override
        onlyOwner
        returns (address oldOwner, address newOwner)
    {
        _validateTo(to);

        _balances[to] == _balances[msg.sender];
        _balances[msg.sender] = 0;

        _mutateOwner(to);
        return (msg.sender, to);
    }

    function setSplitBonus(uint256 bonus)
        external
        onlyOwner
    {
        SplitBonus._setSplitBonus(bonus);
    }

    function _validateTo(address to) internal view {
        require(to != address(0), "QUOTER-PM: invalid to address 0x1");
        require(to != address(this), "QUOTER-PM: invalid to address 0x2");
        require(to != msg.sender, "QUOTER-PM: invalid to address 0x3");
    }

    function _validateSR(address sr) internal view {
        require(sr != address(0), "QUOTER-PM: invalid sr address 0x1");
        require(sr != address(this), "QUOTER-PM: invalid sr address 0x2");
        require(sr != msg.sender, "QUOTER-PM: invalid sr address 0x3");
    }

    function _validateAddress(address addr) internal view {
        require(addr != address(0), "QUOTER-PM: invalid address 0x1");
        require(addr != address(this), "QUOTER-PM: invalid address 0x2");
    }

    function _withdrawTransferTo(address to, uint256 amount) internal {
        _validateAddress(to);

        require(amount > 0, "QUOTER-PM: amount is 0");
        require(_balances[msg.sender] >= amount, "QUOTER-PM: insufficient balance");

        _quoterToken.safeTransfer(to, amount);
        _balances[msg.sender] -= amount;
    }
}
