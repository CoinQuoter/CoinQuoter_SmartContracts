const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenMock = artifacts.require('TokenMock');
const LLDEXPenaltyManager = artifacts.require('LLDEXPenaltyManager');

contract('LLDEXPenaltyManager', async function ([makerWallet1, makerWallet2, ownerWallet, ownerWalletNew, collectorAddress1, collectorAddress2, takerWallet]) {
    /*
        Misc
    */
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        this.lldexToken = await TokenMock.new('LLDEX Token', 'LLDEX');
        this.lldexPM = await LLDEXPenaltyManager.new(this.lldexToken.address, 25, { from: ownerWallet });

        await this.lldexToken.mint(makerWallet1, '1000');
        await this.lldexToken.mint(makerWallet2, '1000');

        await this.lldexToken.approve(this.lldexPM.address, '500', { from: makerWallet1 });
        await this.lldexToken.approve(this.lldexPM.address, '500', { from: makerWallet2 });
    });

    describe('LLDEX-PM balance', async function () {
        it('balanceOf should return balance of address', async function () {
            const balanceBefore = await this.lldexPM.balanceOf(makerWallet1);
            await this.lldexPM.depositToken(150);
            await this.lldexPM.balanceOf(makerWallet1);

            expect(balanceBefore).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('150');
        });
    });

    describe('LLDEX-PM Token deposit', async function () {
        it('depositToken should deposit token', async function () {
            const makerBalance = await this.lldexToken.balanceOf(makerWallet1);
            const balanceBefore = await this.lldexPM.balanceOf(makerWallet1);

            await this.lldexPM.depositToken(100);

            expect(balanceBefore).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(this.lldexPM.address)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal(makerBalance.subn(100));
        });

        it('depositToken should revert if amount is 0', async function () {
            expectRevert(
                this.lldexPM.depositToken(0),
                'LLDEX-PM: amount is 0'
            );
        });

        it('depositToken should revert if amount exeeds balance', async function () {
            await this.lldexToken.approve(this.lldexPM.address, '5000', { from: makerWallet1 });

            expectRevert(
                this.lldexPM.depositToken(1001),
                'ERC20: transfer amount exceeds balance'
            );
        });

        it('depositToken should revert if amount exeeds allowance', async function () {
            expectRevert(this.lldexPM.depositToken(501), "ERC20: insufficient allowance");
        });

        it('depositToken should revert if amount exeeds allowance', async function () {
            expectRevert(this.lldexPM.depositToken(501), "ERC20: insufficient allowance");
        });

        it('depositToken should emit event TokenDeposited on deposit', async function () {
            const receipt = await this.lldexPM.depositToken(100);

            expectEvent(receipt, 'TokenDeposited', { 
                sender: makerWallet1,
                amount: '100',
                balance: '100'
            });
        });
    });

    describe('LLDEX-PM Token withdraw', async function () {
        it('withdrawToken should withdraw token', async function () {
            await this.lldexPM.depositToken(200);

            const makerBalance = await this.lldexToken.balanceOf(makerWallet1);
            const balanceBefore = await this.lldexPM.balanceOf(makerWallet1);

            await this.lldexPM.withdrawToken(100);

            expect(balanceBefore).to.be.bignumber.equal('200');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(this.lldexPM.address)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal(makerBalance.addn(100));
        });

        it('withdrawTokenTo should withdraw token to given address', async function () {
            await this.lldexPM.depositToken(200);

            const makerABalanceToken = await this.lldexToken.balanceOf(makerWallet1);
            const makerBBalanceToken = await this.lldexToken.balanceOf(makerWallet2);
            const balanceMakerABefore = await this.lldexPM.balanceOf(makerWallet1);
            const balanceMakerBBefore = await this.lldexPM.balanceOf(makerWallet2);

            await this.lldexPM.withdrawTokenTo(makerWallet2, 100);

            expect(makerABalanceToken).to.be.bignumber.equal('800');
            expect(makerBBalanceToken).to.be.bignumber.equal('1000');
            expect(balanceMakerABefore).to.be.bignumber.equal('200');
            expect(balanceMakerBBefore).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexPM.balanceOf(makerWallet2)).to.be.bignumber.equal('0');
            expect(await this.lldexToken.balanceOf(this.lldexPM.address)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal('800');
            expect(await this.lldexToken.balanceOf(makerWallet2)).to.be.bignumber.equal('1100');
        });

        it('withdrawToken should revert if amount is 0', async function () {
            expectRevert(
                this.lldexPM.withdrawToken(0),
                'LLDEX-PM: amount is 0'
            );
        });

        it('withdrawToken should revert if amount exceeds balance', async function () {
            expectRevert(
                this.lldexPM.withdrawToken(50),
                'LLDEX-PM: insufficient balance'
            );
        });

        it('withdrawTokenTo should revert if address is 0', async function () {
            await this.lldexPM.depositToken(250);

            expectRevert(
                this.lldexPM.withdrawTokenTo(zeroAddress, 50),
                'LLDEX-PM: invalid address 0x1'
            );
        });

        it('withdrawTokenTo should revert if address is PM address', async function () {
            await this.lldexPM.depositToken(250);

            expectRevert(
                this.lldexPM.withdrawTokenTo(this.lldexPM.address, 50),
                'LLDEX-PM: invalid address 0x2'
            );
        });


        it('withdrawToken should emit event TokenWithdrawn on withdraw', async function () {
            await this.lldexPM.depositToken(250);
            const receipt = await this.lldexPM.withdrawToken(100);

            expectEvent(receipt, "TokenWithdrawn", {
              sender: makerWallet1,
              amount: "100",
              balance: "150",
            });
        });

        it("withdrawTokenTo should emit event TokenWithdrawn on withdraw", async function () {
          await this.lldexPM.depositToken(250);
          const receipt = await this.lldexPM.withdrawTokenTo(makerWallet2, 100);

          expectEvent(receipt, "TokenWithdrawn", {
            sender: makerWallet1,
            amount: "100",
            balance: "150",
          });
        });
    });

    describe('LLDEX-PM balance transfer', async function () {
        it('transferTo should transfer balance between two accounts', async function () {
            await this.lldexPM.depositToken(200);

            const makerABalance = await this.lldexPM.balanceOf(makerWallet1);
            const makerBBalance = await this.lldexPM.balanceOf(makerWallet2);

            await this.lldexPM.transferTo(makerWallet2, 100);

            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal('800');
            expect(await this.lldexToken.balanceOf(makerWallet2)).to.be.bignumber.equal('1000');
            expect(makerABalance).to.be.bignumber.equal('200');
            expect(makerBBalance).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexPM.balanceOf(makerWallet2)).to.be.bignumber.equal('100');
        });


        it('transferTo should revert if to address is 0', async function () {
            expectRevert(
                this.lldexPM.transferTo(zeroAddress, 50),
                'LLDEX-PM: invalid to address 0x1'
            );
        });


        it('transferTo should revert if to address is PM address', async function () {
            expectRevert(
                this.lldexPM.transferTo(this.lldexPM.address, 50),
                'LLDEX-PM: invalid to address 0x2'
            );
        });

        it('transferTo should revert if to address is sender address', async function () {
            expectRevert(
                this.lldexPM.transferTo(makerWallet1, 50),
                'LLDEX-PM: invalid to address 0x3'
            );
        });

        it('transferTo should revert if amount is 0', async function () {
            expectRevert(
                this.lldexPM.transferTo(makerWallet2, 0),
                'LLDEX-PM: amount is 0'
            );
        });

        it('transferTo should revert if amount exceeds senders balance', async function () {
            expectRevert(
                this.lldexPM.transferTo(makerWallet2, 50),
                'LLDEX-PM: insufficient balance'
            );
        });

        it('transferTo should emit event BalanceTransfered on transfer', async function () {
            await this.lldexPM.depositToken(250);
            const receipt = await this.lldexPM.transferTo(makerWallet2, 100);

            expectEvent(receipt, 'BalanceTransfered', { 
                from: makerWallet1,
                to: makerWallet2,
                amount: '100'
            });
        });
    });

    describe('LLDEX-PM penalty issuing', async function () {
        it('issuePenalty should transfer amount of balance of fined account to owner', async function () {
            await this.lldexPM.depositToken(200);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            const maker1Balance = await this.lldexPM.balanceOf(makerWallet1);
            const ownerBalance = await this.lldexPM.balanceOf(ownerWallet);

            await this.lldexPM.issuePenalty(makerWallet1, 100, {from: collectorAddress1});

            expect(maker1Balance).to.be.bignumber.equal('200');
            expect(ownerBalance).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexPM.balanceOf(ownerWallet)).to.be.bignumber.equal('100');
            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal('800');
            expect(await this.lldexToken.balanceOf(ownerWallet)).to.be.bignumber.equal('0');
        });

        it('issuePenalty should revert if called by not collector account', async function () {
            expectRevert(
                this.lldexPM.issuePenalty(makerWallet1, 100),
                'LLDEX-PM: not collector'
            );
        });

        it('issuePenalty should revert if to address is 0', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenalty(zeroAddress, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x1'
            );
        });


        it('issuePenalty should revert if to address is PM address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenalty(this.lldexPM.address, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x2'
            );
        });

        it('issuePenalty should revert if to address is sender address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenalty(collectorAddress1, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x3'
            );
        });

        it('issuePenalty should revert if balance of charged account exceeds fine amount', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenalty(makerWallet1, 50, {from: collectorAddress1}),
                'LLDEX-PM: insufficient balance'
            );
        });

        it('issuePenalty should emit event PenaltyIssued', async function () {
            await this.lldexPM.depositToken(150);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})
            const receipt = await this.lldexPM.issuePenalty(makerWallet1, 100, {from: collectorAddress1});

            expectEvent(receipt, 'PenaltyIssued', { 
                receiver: makerWallet1,
                amount: '100',
                balance: '50'
            });
        });
    });

    describe('LLDEX-PM split penalty issuing', async function () {
        it('issuePenaltySplit should transfer 75% amount of balance of fined account to owner and 25% to recipient', async function () {
            await this.lldexPM.depositToken(200);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            const maker1Balance = await this.lldexPM.balanceOf(makerWallet1);
            const ownerBalance = await this.lldexPM.balanceOf(ownerWallet);

            await this.lldexPM.issuePenaltySplit(makerWallet1, takerWallet, 100, {from: collectorAddress1});

            expect(maker1Balance).to.be.bignumber.equal('200');
            expect(ownerBalance).to.be.bignumber.equal('0');
            expect(await this.lldexPM.balanceOf(makerWallet1)).to.be.bignumber.equal('100');
            expect(await this.lldexPM.balanceOf(ownerWallet)).to.be.bignumber.equal('75');
            expect(await this.lldexPM.balanceOf(takerWallet)).to.be.bignumber.equal('25');
            expect(await this.lldexToken.balanceOf(makerWallet1)).to.be.bignumber.equal('800');
            expect(await this.lldexToken.balanceOf(ownerWallet)).to.be.bignumber.equal('0');
        });

        it('issuePenaltySplit should revert if called by not collector account', async function () {
            expectRevert(
                this.lldexPM.issuePenaltySplit(makerWallet1, takerWallet, 100),
                'LLDEX-PM: not collector'
            );
        });

        it('issuePenaltySplit should revert if to address is 0', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(zeroAddress, takerWallet, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x1'
            );
        });


        it('issuePenaltySplit should revert if to address is PM address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(this.lldexPM.address, takerWallet, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x2'
            );
        });

        it('issuePenaltySplit should revert if to address is sender address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(collectorAddress1, takerWallet, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid to address 0x3'
            );
        });

        it('issuePenaltySplit should revert if split recipient address is 0', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(makerWallet1, zeroAddress, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid sr address 0x1'
            );
        });


        it('issuePenaltySplit should revert if split recipient address is PM address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(makerWallet1, this.lldexPM.address, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid sr address 0x2'
            );
        });

        it('issuePenaltySplit should revert if split recipient address is sender address', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(makerWallet1, collectorAddress1, 50, {from: collectorAddress1}),
                'LLDEX-PM: invalid sr address 0x3'
            );
        });

        it('issuePenaltySplit should revert if balance of charged account exceeds fine amount', async function () {
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expectRevert(
                this.lldexPM.issuePenaltySplit(makerWallet1, takerWallet, 50, {from: collectorAddress1}),
                'LLDEX-PM: insufficient balance'
            );
        });

        it('issuePenaltySplit should emit event SplitPenaltyIssued', async function () {
            await this.lldexPM.depositToken(150);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})
            const receipt = await this.lldexPM.issuePenaltySplit(makerWallet1, takerWallet, 100, {from: collectorAddress1});

            expectEvent(receipt, 'SplitPenaltyIssued', { 
                receiver: makerWallet1,
                splitTo: takerWallet,
                splitPercentage: '25',
                amount: '100',
                balance: '50'
            });
        });
    });

    describe('LLDEX-PM collectors', async function () {
        it('addCollector should add new collector', async function () {
            const isCollectorBefore = await this.lldexPM.isCollector(collectorAddress1);

            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expect(isCollectorBefore).to.be.eq(false);
            expect(await this.lldexPM.isCollector(collectorAddress1)).to.be.eq(true);
        });

        it('addCollector should work for one and more collectors', async function () {
            const isCollector1Before = await this.lldexPM.isCollector(collectorAddress1);
            const isCollector2Before = await this.lldexPM.isCollector(collectorAddress2);

            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})
            await this.lldexPM.addCollector(collectorAddress2, {from: ownerWallet})

            expect(isCollector1Before).to.be.eq(false);
            expect(isCollector2Before).to.be.eq(false);
            expect(await this.lldexPM.isCollector(collectorAddress1)).to.be.eq(true);
            expect(await this.lldexPM.isCollector(collectorAddress2)).to.be.eq(true);
        });

        it('addCollector should revert if called by not an owner', async function () {
            expectRevert(
                this.lldexPM.addCollector(collectorAddress1),
                'MO: Access denied'
            );
        });

        it('addCollector should revert if collector address is 0', async function () {
            expectRevert(
                this.lldexPM.addCollector(zeroAddress, {from: ownerWallet}),
                'LLDEX-PM: invalid address 0x1'
            );
        });

        it('removeCollector should remove collector', async function () {
            const isCollectorBefore = await this.lldexPM.isCollector(collectorAddress1);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})
            const isCollectorAfter = await this.lldexPM.isCollector(collectorAddress1);
            await this.lldexPM.removeCollector(collectorAddress1, {from: ownerWallet})

            expect(isCollectorBefore).to.be.eq(false);
            expect(isCollectorAfter).to.be.eq(true);
            expect(await this.lldexPM.isCollector(collectorAddress1)).to.be.eq(false);
        });

        it('removeCollector should revert if called by not an owner', async function () {
            expectRevert(
                this.lldexPM.removeCollector(collectorAddress1),
                'MO: Access denied'
            );
        });

        it('removeCollector should revert if collector address is 0', async function () {
            expectRevert(
                this.lldexPM.removeCollector(zeroAddress, {from: ownerWallet}),
                'LLDEX-PM: invalid address 0x1'
            );
        });

        it('isCollector should check if address is collector', async function () {
            const isCollectorBefore = await this.lldexPM.isCollector(collectorAddress1);
            await this.lldexPM.addCollector(collectorAddress1, {from: ownerWallet})

            expect(isCollectorBefore).to.be.eq(false);
            expect(await this.lldexPM.isCollector(collectorAddress1)).to.be.eq(true);
        });
    });

    describe('LLDEX-PM ownership', async function () {
        it('mutableOwner should return current PM owner', async function () {
            const owner = await this.lldexPM.mutableOwner();

            expect(owner).to.be.eq(ownerWallet);
        });

        it('transferOwnership should transfer ownership of PM to another address', async function () {
            const ownerBefore = await this.lldexPM.mutableOwner();
            await this.lldexPM.transferOwnership(ownerWalletNew, {from: ownerWallet});
            const ownerAfter = await this.lldexPM.mutableOwner();

            expect(ownerBefore).to.be.eq(ownerWallet);
            expect(ownerAfter).to.be.eq(ownerWalletNew);
        });

        it('transferOwnership should revert if called by not an owner', async function () {
            expectRevert(
                this.lldexPM.transferOwnership(ownerWalletNew),
                'MO: Access denied'
            );
        });
    });

    describe('LLDEX-PM split bonus', async function () {
        it('setSplitBonus should set new splt bonus', async function () {
            const bonusBefore = await this.lldexPM.getSplitBonus();
            await this.lldexPM.setSplitBonus(55, { from: ownerWallet });
            const bonusAfter = await this.lldexPM.getSplitBonus();
                
            expect(bonusBefore).to.be.bignumber.equal('25');
            expect(bonusAfter).to.be.bignumber.equal('55');
        });

        it('setSplitBonus should revert if called by not an owner', async function () {                
            expectRevert(
                this.lldexPM.setSplitBonus(55),
                'MO: Access denied'
            );
        });
    });
});