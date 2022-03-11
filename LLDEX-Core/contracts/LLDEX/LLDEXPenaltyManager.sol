// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./helpers/MutableOwner.sol";
import "./helpers/SplitBonus.sol";
import "./interfaces/IPenaltyManager.sol";

// @title LLDEX Penalty Manager v1
contract LLDEXPenaltyManager is 
    MutableOwner(msg.sender), 
    SplitBonus,
    ReentrancyGuard, 
    IPenaltyManager 
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // LLDEX token
    IERC20 private _lldexToken;

    // Mapping of balance owner (maker, admin) to amount
    mapping(address => uint256) private _balances;

    // Mapping of addresses that are allowed to issue penalties to makers
    mapping(address => bool) private _collectors;

    modifier collectorOnly() {
        require(_collectors[msg.sender], "LLDEX-PM: not collector");

        _;
    }

    constructor(address lldexAddress, uint256 splitBonus) SplitBonus(splitBonus, 100) {
        require(lldexAddress != address(0), "LLDEX-PM: 0 LLDEX token address");

        _lldexToken = IERC20(lldexAddress);
    }

    function depositToken(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "LLDEX-PM: amount is 0");

        _lldexToken.safeTransferFrom(msg.sender, address(this), amount);
        _balances[msg.sender] += amount;

        emit TokenDeposited(msg.sender, amount, _balances[msg.sender]);

        return _balances[msg.sender];
    }

    function withdrawToken(uint256 amount) external override nonReentrant returns (uint256) {
        _withdrawTransferTo(msg.sender, amount);

        emit TokenWithdrawed(msg.sender, amount, _balances[msg.sender]);
        return _balances[msg.sender];
    }

    function withdrawTokenTo(address to, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        _withdrawTransferTo(to, amount);

        emit TokenWithdrawed(msg.sender, amount, _balances[msg.sender]);
        return _balances[msg.sender];
    }

    function transferTo(address to, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256 balanceSender, uint256 balanceRecipient)
    {
        _validateTo(to);

        require(amount > 0, "LLDEX-PM: amount is 0");
        require(_balances[msg.sender] >= amount, "LLDEX-PM: insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit BalanceTransfered(msg.sender, to, amount);
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

        require(amount > 0, "LLDEX-PM: amount is 0");
        require(_balances[to] >= amount, "LLDEX-PM: insufficient balance");

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

        require(amount > 0, "LLDEX-PM: amount is 0");
        require(to != splitRecipient, "LLDEX-PM: invalid sr address 0x4");
        require(_balances[to] >= amount, "LLDEX-PM: insufficient balance");

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
        require(collector != address(0), "LLDEX-PM: invalid address 0x1");

        _collectors[collector] = true;
    }

    function removeCollector(address collector) external override onlyOwner {
        require(collector != address(0), "LLDEX-PM: invalid address 0x1");

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
        require(to != address(0), "LLDEX-PM: invalid to address 0x1");
        require(to != address(this), "LLDEX-PM: invalid to address 0x2");
        require(to != msg.sender, "LLDEX-PM: invalid to address 0x3");
    }

    function _validateSR(address sr) internal view {
        require(sr != address(0), "LLDEX-PM: invalid sr address 0x1");
        require(sr != address(this), "LLDEX-PM: invalid sr address 0x2");
        require(sr != msg.sender, "LLDEX-PM: invalid sr address 0x3");
    }

    function _validateAddress(address addr) internal view {
        require(addr != address(0), "LLDEX-PM: invalid address 0x1");
        require(addr != address(this), "LLDEX-PM: invalid address 0x2");
    }

    function _withdrawTransferTo(address to, uint256 amount) internal {
        _validateAddress(to);

        require(amount > 0, "LLDEX-PM: amount is 0");
        require(_balances[msg.sender] >= amount, "LLDEX-PM: insufficient balance");

        _lldexToken.safeTransfer(to, amount);
        _balances[msg.sender] -= amount;
    }
}
