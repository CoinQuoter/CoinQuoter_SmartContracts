const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const SplitBonus = artifacts.require('SplitBonus');
const SplitBonusMock = artifacts.require('SplitBonusMock');

describe('SplitBonus', async function () {
    beforeEach(async function () {
        this.splitBonus = await SplitBonus.new(25, 100);
        this.SplitBonusMock = await SplitBonusMock.new(25, 100);
    });

    it('getSplitBonus should return split percentage', async function () {
        const bonus = await this.splitBonus.getSplitBonus();
            
        expect(bonus).to.be.bignumber.equal('25');
    });

    it('getSplitScale should return split percentage scale', async function () {
        const bonus = await this.splitBonus.getSplitScale();
            
        expect(bonus).to.be.bignumber.equal('100');
    });

    it('_setSplitBonus should set new bonus', async function () {
        const bonusBefore = await this.SplitBonusMock.getSplitBonus();
        await this.SplitBonusMock.setSplitBonus(55);
        const bonusAfter = await this.SplitBonusMock.getSplitBonus();
            
        expect(bonusBefore).to.be.bignumber.equal('25');
        expect(bonusAfter).to.be.bignumber.equal('55');
    });

    it('_setSplitBonus should revert if bonus percentage exceeds scale', async function () {
        expectRevert(
            this.SplitBonusMock.setSplitBonus(105),
            'SB: Invalid bonus value'
        );
    });

       it('constructor should revert if bonus percentage exceeds scale', async function () {
        expectRevert(
            SplitBonus.new(125, 100),
            'SB: Invalid bonus value'
        );
    });
});