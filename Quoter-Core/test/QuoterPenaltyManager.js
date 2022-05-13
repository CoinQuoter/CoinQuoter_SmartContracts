const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenMock = artifacts.require('TokenMock');
const QuoterPenaltyManager = artifacts.require("QuoterPenaltyManager");

contract(
  "QuoterPenaltyManager",
  async function ([
    makerWallet1,
    makerWallet2,
    ownerWallet,
    ownerWalletNew,
    collectorAddress1,
    collectorAddress2,
    takerWallet,
  ]) {
    /*
        Misc
    */
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
      this.quoterToken = await TokenMock.new("Quoter Token", "QTR");
      this.quoterPM = await QuoterPenaltyManager.new(this.quoterToken.address, 25, ownerWallet, { from: ownerWallet });

      await this.quoterToken.mint(makerWallet1, "1000");
      await this.quoterToken.mint(makerWallet2, "1000");

      await this.quoterToken.approve(this.quoterPM.address, "500", { from: makerWallet1 });
      await this.quoterToken.approve(this.quoterPM.address, "500", { from: makerWallet2 });
    });

    describe("QUOTER-PM owner", async function () {
      it("mutableOwner should return owner of the smart contract", async function () {
        const owner = await this.quoterPM.mutableOwner();

        expect(owner).to.be.equal(ownerWallet);
      });
    });

    describe("QUOTER-PM balance", async function () {
      it("balanceOf should return balance of address", async function () {
        const balanceBefore = await this.quoterPM.balanceOf(makerWallet1);
        await this.quoterPM.depositToken(150);
        await this.quoterPM.balanceOf(makerWallet1);

        expect(balanceBefore).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("150");
      });
    });

    describe("QUOTER-PM Token deposit", async function () {
      it("depositToken should deposit token", async function () {
        const makerBalance = await this.quoterToken.balanceOf(makerWallet1);
        const balanceBefore = await this.quoterPM.balanceOf(makerWallet1);

        await this.quoterPM.depositToken(100);

        expect(balanceBefore).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(this.quoterPM.address)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal(makerBalance.subn(100));
      });

      it("depositToken should revert if amount is 0", async function () {
        expectRevert(this.quoterPM.depositToken(0), "QUOTER-PM: amount is 0");
      });

      it("depositToken should revert if amount exeeds balance", async function () {
        await this.quoterToken.approve(this.quoterPM.address, "5000", { from: makerWallet1 });

        expectRevert(this.quoterPM.depositToken(1001), "ERC20: transfer amount exceeds balance");
      });

      it("depositToken should revert if amount exeeds allowance", async function () {
        expectRevert(this.quoterPM.depositToken(501), "ERC20: insufficient allowance");
      });

      it("depositToken should revert if amount exeeds allowance", async function () {
        expectRevert(this.quoterPM.depositToken(501), "ERC20: insufficient allowance");
      });

      it("depositToken should emit event TokenDeposited on deposit", async function () {
        const receipt = await this.quoterPM.depositToken(100);

        expectEvent(receipt, "TokenDeposited", {
          sender: makerWallet1,
          amount: "100",
          balance: "100",
        });
      });
    });

    describe("QUOTER-PM Token withdraw", async function () {
      it("withdrawToken should withdraw token", async function () {
        await this.quoterPM.depositToken(200);

        const makerBalance = await this.quoterToken.balanceOf(makerWallet1);
        const balanceBefore = await this.quoterPM.balanceOf(makerWallet1);

        await this.quoterPM.withdrawToken(100);

        expect(balanceBefore).to.be.bignumber.equal("200");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(this.quoterPM.address)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal(makerBalance.addn(100));
      });

      it("withdrawTokenTo should withdraw token to given address", async function () {
        await this.quoterPM.depositToken(200);

        const makerABalanceToken = await this.quoterToken.balanceOf(makerWallet1);
        const makerBBalanceToken = await this.quoterToken.balanceOf(makerWallet2);
        const balanceMakerABefore = await this.quoterPM.balanceOf(makerWallet1);
        const balanceMakerBBefore = await this.quoterPM.balanceOf(makerWallet2);

        await this.quoterPM.withdrawTokenTo(makerWallet2, 100);

        expect(makerABalanceToken).to.be.bignumber.equal("800");
        expect(makerBBalanceToken).to.be.bignumber.equal("1000");
        expect(balanceMakerABefore).to.be.bignumber.equal("200");
        expect(balanceMakerBBefore).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterPM.balanceOf(makerWallet2)).to.be.bignumber.equal("0");
        expect(await this.quoterToken.balanceOf(this.quoterPM.address)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal("800");
        expect(await this.quoterToken.balanceOf(makerWallet2)).to.be.bignumber.equal("1100");
      });

      it("withdrawToken should revert if amount is 0", async function () {
        expectRevert(this.quoterPM.withdrawToken(0), "QUOTER-PM: amount is 0");
      });

      it("withdrawToken should revert if amount exceeds balance", async function () {
        expectRevert(this.quoterPM.withdrawToken(50), "QUOTER-PM: insufficient balance");
      });

      it("withdrawTokenTo should revert if address is 0", async function () {
        await this.quoterPM.depositToken(250);

        expectRevert(this.quoterPM.withdrawTokenTo(zeroAddress, 50), "QUOTER-PM: invalid address 0x1");
      });

      it("withdrawTokenTo should revert if address is PM address", async function () {
        await this.quoterPM.depositToken(250);

        expectRevert(
          this.quoterPM.withdrawTokenTo(this.quoterPM.address, 50),
          "QUOTER-PM: invalid address 0x2",
        );
      });

      it("withdrawToken should emit event TokenWithdrawn on withdraw", async function () {
        await this.quoterPM.depositToken(250);
        const receipt = await this.quoterPM.withdrawToken(100);

        expectEvent(receipt, "TokenWithdrawn", {
          sender: makerWallet1,
          amount: "100",
          balance: "150",
        });
      });

      it("withdrawTokenTo should emit event TokenWithdrawn on withdraw", async function () {
        await this.quoterPM.depositToken(250);
        const receipt = await this.quoterPM.withdrawTokenTo(makerWallet2, 100);

        expectEvent(receipt, "TokenWithdrawn", {
          sender: makerWallet1,
          amount: "100",
          balance: "150",
        });
      });
    });

    describe("QUOTER-PM balance transfer", async function () {
      it("transferTo should transfer balance between two accounts", async function () {
        await this.quoterPM.depositToken(200);

        const makerABalance = await this.quoterPM.balanceOf(makerWallet1);
        const makerBBalance = await this.quoterPM.balanceOf(makerWallet2);

        await this.quoterPM.transferTo(makerWallet2, 100);

        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal("800");
        expect(await this.quoterToken.balanceOf(makerWallet2)).to.be.bignumber.equal("1000");
        expect(makerABalance).to.be.bignumber.equal("200");
        expect(makerBBalance).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterPM.balanceOf(makerWallet2)).to.be.bignumber.equal("100");
      });

      it("transferTo should revert if to address is 0", async function () {
        expectRevert(this.quoterPM.transferTo(zeroAddress, 50), "QUOTER-PM: invalid to address 0x1");
      });

      it("transferTo should revert if to address is PM address", async function () {
        expectRevert(
          this.quoterPM.transferTo(this.quoterPM.address, 50),
          "QUOTER-PM: invalid to address 0x2",
        );
      });

      it("transferTo should revert if to address is sender address", async function () {
        expectRevert(this.quoterPM.transferTo(makerWallet1, 50), "QUOTER-PM: invalid to address 0x3");
      });

      it("transferTo should revert if amount is 0", async function () {
        expectRevert(this.quoterPM.transferTo(makerWallet2, 0), "QUOTER-PM: amount is 0");
      });

      it("transferTo should revert if amount exceeds senders balance", async function () {
        expectRevert(this.quoterPM.transferTo(makerWallet2, 50), "QUOTER-PM: insufficient balance");
      });

      it("transferTo should emit event BalanceTransfered on transfer", async function () {
        await this.quoterPM.depositToken(250);
        const receipt = await this.quoterPM.transferTo(makerWallet2, 100);

        expectEvent(receipt, "BalanceTransfered", {
          from: makerWallet1,
          to: makerWallet2,
          amount: "100",
          balanceFrom: "150",
          balanceTo: "100",
        });
      });
    });

    describe("QUOTER-PM penalty issuing", async function () {
      it("issuePenalty should transfer amount of balance of fined account to owner", async function () {
        await this.quoterPM.depositToken(200);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        const maker1Balance = await this.quoterPM.balanceOf(makerWallet1);
        const ownerBalance = await this.quoterPM.balanceOf(ownerWallet);

        await this.quoterPM.issuePenalty(makerWallet1, 100, { from: collectorAddress1 });

        expect(maker1Balance).to.be.bignumber.equal("200");
        expect(ownerBalance).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterPM.balanceOf(ownerWallet)).to.be.bignumber.equal("100");
        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal("800");
        expect(await this.quoterToken.balanceOf(ownerWallet)).to.be.bignumber.equal("0");
      });

      it("issuePenalty should revert if called by not collector account", async function () {
        expectRevert(this.quoterPM.issuePenalty(makerWallet1, 100), "QUOTER-PM: not collector");
      });

      it("issuePenalty should revert if to address is 0", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenalty(zeroAddress, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid to address 0x1",
        );
      });

      it("issuePenalty should revert if to address is PM address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenalty(this.quoterPM.address, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid to address 0x2",
        );
      });

      it("issuePenalty should revert if to address is sender address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenalty(collectorAddress1, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid to address 0x3",
        );
      });

      it("issuePenalty should revert if balance of charged account exceeds fine amount", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenalty(makerWallet1, 50, { from: collectorAddress1 }),
          "QUOTER-PM: insufficient balance",
        );
      });

      it("issuePenalty should emit event PenaltyIssued", async function () {
        await this.quoterPM.depositToken(150);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });
        const receipt = await this.quoterPM.issuePenalty(makerWallet1, 100, { from: collectorAddress1 });

        expectEvent(receipt, "PenaltyIssued", {
          receiver: makerWallet1,
          amount: "100",
          balance: "50",
        });
      });
    });

    describe("QUOTER-PM split penalty issuing", async function () {
      it("issuePenaltySplit should transfer 75% amount of balance of fined account to owner and 25% to recipient", async function () {
        await this.quoterPM.depositToken(200);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        const maker1Balance = await this.quoterPM.balanceOf(makerWallet1);
        const ownerBalance = await this.quoterPM.balanceOf(ownerWallet);

        await this.quoterPM.issuePenaltySplit(makerWallet1, takerWallet, 100, { from: collectorAddress1 });

        expect(maker1Balance).to.be.bignumber.equal("200");
        expect(ownerBalance).to.be.bignumber.equal("0");
        expect(await this.quoterPM.balanceOf(makerWallet1)).to.be.bignumber.equal("100");
        expect(await this.quoterPM.balanceOf(ownerWallet)).to.be.bignumber.equal("75");
        expect(await this.quoterPM.balanceOf(takerWallet)).to.be.bignumber.equal("25");
        expect(await this.quoterToken.balanceOf(makerWallet1)).to.be.bignumber.equal("800");
        expect(await this.quoterToken.balanceOf(ownerWallet)).to.be.bignumber.equal("0");
      });

      it("issuePenaltySplit should revert if called by not collector account", async function () {
        expectRevert(
          this.quoterPM.issuePenaltySplit(makerWallet1, takerWallet, 100),
          "QUOTER-PM: not collector",
        );
      });

      it("issuePenaltySplit should revert if to address is 0", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(zeroAddress, takerWallet, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid to address 0x1",
        );
      });

      it("issuePenaltySplit should revert if to address is PM address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(this.quoterPM.address, takerWallet, 50, {
            from: collectorAddress1,
          }),
          "QUOTER-PM: invalid to address 0x2",
        );
      });

      it("issuePenaltySplit should revert if to address is sender address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(collectorAddress1, takerWallet, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid to address 0x3",
        );
      });

      it("issuePenaltySplit should revert if split recipient address is 0", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(makerWallet1, zeroAddress, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid sr address 0x1",
        );
      });

      it("issuePenaltySplit should revert if split recipient address is PM address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(makerWallet1, this.quoterPM.address, 50, {
            from: collectorAddress1,
          }),
          "QUOTER-PM: invalid sr address 0x2",
        );
      });

      it("issuePenaltySplit should revert if split recipient address is sender address", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(makerWallet1, collectorAddress1, 50, { from: collectorAddress1 }),
          "QUOTER-PM: invalid sr address 0x3",
        );
      });

      it("issuePenaltySplit should revert if balance of charged account exceeds fine amount", async function () {
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expectRevert(
          this.quoterPM.issuePenaltySplit(makerWallet1, takerWallet, 50, { from: collectorAddress1 }),
          "QUOTER-PM: insufficient balance",
        );
      });

      it("issuePenaltySplit should emit event SplitPenaltyIssued", async function () {
        await this.quoterPM.depositToken(150);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });
        const receipt = await this.quoterPM.issuePenaltySplit(makerWallet1, takerWallet, 100, {
          from: collectorAddress1,
        });

        expectEvent(receipt, "SplitPenaltyIssued", {
          receiver: makerWallet1,
          splitTo: takerWallet,
          splitPercentage: "25",
          amount: "100",
          balance: "50",
        });
      });
    });

    describe("QUOTER-PM collectors", async function () {
      it("addCollector should add new collector", async function () {
        const isCollectorBefore = await this.quoterPM.isCollector(collectorAddress1);

        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expect(isCollectorBefore).to.be.eq(false);
        expect(await this.quoterPM.isCollector(collectorAddress1)).to.be.eq(true);
      });

      it("addCollector should work for one and more collectors", async function () {
        const isCollector1Before = await this.quoterPM.isCollector(collectorAddress1);
        const isCollector2Before = await this.quoterPM.isCollector(collectorAddress2);

        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });
        await this.quoterPM.addCollector(collectorAddress2, { from: ownerWallet });

        expect(isCollector1Before).to.be.eq(false);
        expect(isCollector2Before).to.be.eq(false);
        expect(await this.quoterPM.isCollector(collectorAddress1)).to.be.eq(true);
        expect(await this.quoterPM.isCollector(collectorAddress2)).to.be.eq(true);
      });

      it("addCollector should revert if called by not an owner", async function () {
        expectRevert(this.quoterPM.addCollector(collectorAddress1), "MO: Access denied");
      });

      it("addCollector should revert if collector address is 0", async function () {
        expectRevert(
          this.quoterPM.addCollector(zeroAddress, { from: ownerWallet }),
          "QUOTER-PM: invalid address 0x1",
        );
      });

      it("removeCollector should remove collector", async function () {
        const isCollectorBefore = await this.quoterPM.isCollector(collectorAddress1);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });
        const isCollectorAfter = await this.quoterPM.isCollector(collectorAddress1);
        await this.quoterPM.removeCollector(collectorAddress1, { from: ownerWallet });

        expect(isCollectorBefore).to.be.eq(false);
        expect(isCollectorAfter).to.be.eq(true);
        expect(await this.quoterPM.isCollector(collectorAddress1)).to.be.eq(false);
      });

      it("removeCollector should revert if called by not an owner", async function () {
        expectRevert(this.quoterPM.removeCollector(collectorAddress1), "MO: Access denied");
      });

      it("removeCollector should revert if collector address is 0", async function () {
        expectRevert(
          this.quoterPM.removeCollector(zeroAddress, { from: ownerWallet }),
          "QUOTER-PM: invalid address 0x1",
        );
      });

      it("isCollector should check if address is collector", async function () {
        const isCollectorBefore = await this.quoterPM.isCollector(collectorAddress1);
        await this.quoterPM.addCollector(collectorAddress1, { from: ownerWallet });

        expect(isCollectorBefore).to.be.eq(false);
        expect(await this.quoterPM.isCollector(collectorAddress1)).to.be.eq(true);
      });
    });

    describe("QUOTER-PM ownership", async function () {
      it("mutableOwner should return current PM owner", async function () {
        const owner = await this.quoterPM.mutableOwner();

        expect(owner).to.be.eq(ownerWallet);
      });

      it("transferOwnership should transfer ownership of PM to another address", async function () {
        const ownerBefore = await this.quoterPM.mutableOwner();
        await this.quoterPM.transferOwnership(ownerWalletNew, { from: ownerWallet });
        const ownerAfter = await this.quoterPM.mutableOwner();

        expect(ownerBefore).to.be.eq(ownerWallet);
        expect(ownerAfter).to.be.eq(ownerWalletNew);
      });

      it("transferOwnership should revert if called by not an owner", async function () {
        expectRevert(this.quoterPM.transferOwnership(ownerWalletNew), "MO: Access denied");
      });
    });

    describe("QUOTER-PM split bonus", async function () {
      it("setSplitBonus should set new splt bonus", async function () {
        const bonusBefore = await this.quoterPM.getSplitBonus();
        await this.quoterPM.setSplitBonus(55, { from: ownerWallet });
        const bonusAfter = await this.quoterPM.getSplitBonus();

        expect(bonusBefore).to.be.bignumber.equal("25");
        expect(bonusAfter).to.be.bignumber.equal("55");
      });

      it("setSplitBonus should revert if called by not an owner", async function () {
        expectRevert(this.quoterPM.setSplitBonus(55), "MO: Access denied");
      });
    });
  },
);