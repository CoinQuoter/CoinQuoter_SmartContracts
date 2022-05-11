const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ethers } = require('ethers');

const ethSigUtil = require('eth-sig-util');
const TokenMock = artifacts.require('TokenMock');
const CallbackMock = artifacts.require('CallbackMock');
const QuoterProtocol = artifacts.require('QuoterProtocol');

const { buildOrderRFQData, generateRFQOrderInfo } = require('./helpers/orderUtils');
const { toBN } = require('./helpers/Utils.js');

contract('QuoterProtocol', async function ([takerWallet, makerWallet, takerSessionWallet, makerSessionWallet, frontendWallet, ownerWalletNew]) {

    /*
        Quoter Protocol session wallets
    */
    const privateKeyMakerSession = Buffer.from('7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', 'hex');
    const privateKeyTakerSession = Buffer.from('5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', 'hex');
    const privateKeyTaker = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');

    /*
        Misc
    */
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const blockchainTimestamp = Date.now() + 3600;
    var expireInTimestamp = blockchainTimestamp + 7200;

    await setTimestamp();

    function buildOrderRFQ(info, takerAsset, makerAsset, takerAmount, makerAmount) {
        return {
            info: info,
            feeAmount: 0,
            takerAsset: takerAsset.address,
            makerAsset: makerAsset.address,
            feeTokenAddress: takerAsset.address,
            frontendAddress: zeroAddress,
            takerAssetData: takerAsset.contract.methods.transferFrom(takerWallet, makerWallet, takerAmount).encodeABI(),
            makerAssetData: makerAsset.contract.methods.transferFrom(makerWallet, takerWallet, makerAmount).encodeABI(),
        };
    }

    const increaseTime = async (increaseBy) => {await network.provider.send("evm_increaseTime", [increaseBy]);}

    async function setTimestamp() {
        await network.provider.send("evm_setNextBlockTimestamp", [blockchainTimestamp])
        await network.provider.send("evm_mine")
    }

    async function createSessions(quoter) {
        await quoter.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet })
        await quoter.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })
    }

    beforeEach(async function () {
        this.fee = await TokenMock.new('Quoter Token', 'QTR');
        this.dai = await TokenMock.new('DAI Token', 'DAI');
        this.weth = await TokenMock.new('WETH Token', 'WETH');

        this.quoter = await QuoterProtocol.new(25);

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await this.dai.getChainId();

        await this.dai.mint(makerWallet, '1000000');
        await this.weth.mint(makerWallet, '1000000');
        await this.dai.mint(takerWallet, '1000000');
        await this.weth.mint(takerWallet, '1000000');

        await this.dai.approve(this.quoter.address, '1000000');
        await this.weth.approve(this.quoter.address, '1000000');
        await this.dai.approve(this.quoter.address, '1000000', { from: makerWallet });
        await this.weth.approve(this.quoter.address, '1000000', { from: makerWallet });

        // Fee token
        await this.fee.mint(makerWallet, '1000');
        await this.fee.mint(takerWallet, '1000');

        await this.fee.approve(this.quoter.address, '500', { from: takerWallet });
        await this.fee.approve(this.quoter.address, '500', { from: makerWallet });
    });

    describe('Session system - createOrUpdateSession', async function () {
        it('createOrUpdateSession should create sessions', async function () {
            await createSessions(this.quoter);

            const takerExpirationTimestamp = await this.quoter.sessionExpirationTime(takerWallet);
            const makerExpirationTimestamp = await this.quoter.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
        });

        it('createOrUpdateSession should update session', async function () {
            await createSessions(this.quoter);

            const expireInForwarded = expireInTimestamp + 3600;

            await this.quoter.createOrUpdateSession(takerSessionWallet, expireInForwarded, { from: takerWallet })
            await this.quoter.createOrUpdateSession(makerSessionWallet, expireInForwarded, { from: makerWallet })

            const takerExpirationTimestamp = await this.quoter.sessionExpirationTime(takerWallet);
            const makerExpirationTimestamp = await this.quoter.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInForwarded.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInForwarded.toString());
        });

        it('createOrUpdateSession should update session key and emit event with updated session key', async function () {
            await createSessions(this.quoter);

            const newSessionKey = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
            const receipt = await this.quoter.createOrUpdateSession(newSessionKey, expireInTimestamp + 3600, { from: takerWallet });
            const sessionKey = (await this.quoter.session(takerWallet)).sessionKey;

            expect(sessionKey).to.be.eq(newSessionKey);
            expectEvent(receipt, 'SessionUpdated', { 
                sender: takerWallet,
                sessionKey: newSessionKey,
                expirationTime: (expireInTimestamp + 3600).toString()
            });
        });

        it('createOrUpdateSession should revert if session timestamp is below block.timestamp', async function () {
            expectRevert(
                this.quoter.createOrUpdateSession(takerSessionWallet, blockchainTimestamp - 3600, { from: takerWallet }),
                'QUOTER: invalid expiration time'
            );
        });

        it('createOrUpdateSession should revert if session key is 0', async function () {
            expectRevert(
              this.quoter.createOrUpdateSession(zeroAddress, blockchainTimestamp - 3600, {
                from: takerWallet,
              }),
              "QUOTER: SK is empty",
            );
        });

        it('createOrUpdateSession should revert if session key is contract address', async function () {
            expectRevert(
              this.quoter.createOrUpdateSession(this.quoter.address, blockchainTimestamp - 3600, {
                from: takerWallet,
              }),
              "QUOTER: invalid SK",
            );
        });

        it('createOrUpdateSession should revert if session key is msg.sender', async function () {
            expectRevert(
              this.quoter.createOrUpdateSession(takerWallet, blockchainTimestamp - 3600, {
                from: takerWallet,
              }),
              "QUOTER: invalid SK - sender",
            );
        }); 

        it('createOrUpdateSession should emit SessionCreated on session creation', async function () {
            const receipt = await this.quoter.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet });

            expectEvent(receipt, 'SessionCreated', { 
                creator: takerWallet,
                sessionKey: takerSessionWallet,
                expirationTime: expireInTimestamp.toString()
            });
        });

        it('createOrUpdateSession should emit SessionUpdated on session update', async function () {
            const expireInForwarded = expireInTimestamp + 3600;
            await this.quoter.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet });
            const receipt = await this.quoter.createOrUpdateSession(takerSessionWallet, expireInForwarded, { from: takerWallet });

            expectEvent(receipt, 'SessionUpdated', { 
                sender: takerWallet,
                sessionKey: takerSessionWallet,
                expirationTime: expireInForwarded.toString()
            });
        });
    });

    describe('Session system - sessionExpirationTime, session', async function() {
        it('sessionExpirationTime should return session expiration time', async function () {
            await createSessions(this.quoter);

            expect(await this.quoter.sessionExpirationTime(takerWallet)).to.be.bignumber.equal(expireInTimestamp.toString());
        });

        it('session should return session data', async function () {
            await createSessions(this.quoter);

            const result = await this.quoter.session(takerWallet);

            expect(result).to.include({
                creator: takerWallet,
                sessionKey: takerSessionWallet,
            })
            expect(result.expirationTime).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(result.txCount).to.be.bignumber.equal('0');
        });

        it('session should return empty data if no session', async function () {
            const result = await this.quoter.session(takerWallet);

            expect(result).to.include({
                creator: zeroAddress,
                sessionKey: zeroAddress,
            })
            expect(result.expirationTime).to.be.bignumber.equal('0');
            expect(result.txCount).to.be.bignumber.equal('0');
        });
    });

    describe('Session system - endSession', async function() {
        it('endSession should set expirationTime to 0', async function () {
            await createSessions(this.quoter);

            var takerExpirationTimestamp = await this.quoter.sessionExpirationTime(takerWallet);
            var makerExpirationTimestamp = await this.quoter.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());

            await this.quoter.endSession({ from: takerWallet });
            await this.quoter.endSession({ from: makerWallet });

            takerExpirationTimestamp = await this.quoter.sessionExpirationTime(takerWallet);
            makerExpirationTimestamp = await this.quoter.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal('0');
            expect(makerExpirationTimestamp).to.be.bignumber.equal('0');
        });

        it('endSession should emit SessionTerminated on session termination', async function () {
            await createSessions(this.quoter);
            const receipt = await this.quoter.endSession({ from: takerWallet });

            expectEvent(receipt, 'SessionTerminated', { 
                sender: takerWallet,
                sessionKey: takerSessionWallet,
            });
        });

        it('endSession should revert if session has been terminated', async function () {
            await createSessions(this.quoter);
            await this.quoter.endSession({ from: takerWallet });

            await expectRevert(this.quoter.endSession({ from: takerWallet }), "QUOTER: invalid session");
        });

        it('endSession should revert if session is expired', async function () {
            await createSessions(this.quoter);
            await increaseTime(7200);

            await expectRevert(this.quoter.endSession({ from: takerWallet }), "QUOTER: session expired");

            expireInTimestamp = expireInTimestamp + 14400; // Update expiration timestamp after updating blockchain timestamp
        });
    });

    describe('OrderRFQ - execution fillOrderRFQ', async function () {
        it('should transfer tokens using transferFrom with maker approval', async function () {
            await this.dai.approve(takerWallet, '2', { from: makerWallet });
            await this.dai.transferFrom(makerWallet, takerWallet, '1', { from: takerWallet });
        });

        // Taker 15 DAI => 15 WETH
        // Maker 15 WETH => 15 DAI
        it('should fill whole OrderRFQ', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);

            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should fill whole OrderRFQ if takingAmount and makingAmount is 0', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);

            await this.quoter.fillOrderRFQ(order, signature, 0, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should partial fill RFQ order', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 2, 2);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const takerDai = await this.dai.balanceOf(makerWallet);
            const makerDai = await this.dai.balanceOf(takerWallet);
            const takerWeth = await this.weth.balanceOf(makerWallet);
            const makerWeth = await this.weth.balanceOf(takerWallet);

            await this.quoter.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should revert partial fill RFQ order when takingAmount is 0', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 5, 10);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 0, 1),
              "QUOTER: one amount should be 0",
            );
        });

        it('should revert if signed order transfer amount is 0', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '0',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: takerWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 0).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 5).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 1, 0),
              "QUOTER: one of order amounts is 0",
            );
        });

        it('should revert if takerAssetData selector is invalid', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.quoter.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 5).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 5).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 5, 0, { from: makerSessionWallet }),
              "QUOTER: takerAsset.call failed",
            );
        });

        it('should revert if makerAssetData selector is invalid', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.dai.address,
                makerAsset: this.quoter.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 5).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 5).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 5, 0, { from: makerSessionWallet }),
              "QUOTER: makerAsset.call failed",
            );
        });

        it('should revert filling RFQ order when takingAmount execeeds order taking amount', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 16, 0),
              "QUOTER: taking amount exceeded",
            );
        });

        it('should not fill order without taker and maker session', async function () {
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "QUOTER: expired maker session",
            );
        });

        it('should not fill order without maker session', async function () {
            await this.quoter.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "QUOTER: expired maker session",
            );
        });

        it('should not fill order without taker session and without valid taker signature (signed by original taker)', async function () {
            await this.quoter.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "QUOTER: SE bad signature",
            );
        });

        it('should fill order if order is signed by original taker (not taker session key)', async function () {
            await this.quoter.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTaker, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);
            
            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should emit event OrderFilledRFQ after filling order', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const receipt = await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expectEvent(receipt, 'OrderFilledRFQ', { 
                takingAmount: '15',
                makingAmount: '15'
            });
        });

        it('should update transaction count of sessions', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const resultBeforeFillTaker = (await this.quoter.session(takerWallet)).txCount;
            const resultBeforeFillMaker = (await this.quoter.session(makerWallet)).txCount;

            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            const resultAfterFillTaker = (await this.quoter.session(takerWallet)).txCount;
            const resultAfterFillMaker = (await this.quoter.session(makerWallet)).txCount;


            expect(resultBeforeFillTaker).to.be.bignumber.equal('0');
            expect(resultBeforeFillMaker).to.be.bignumber.equal('0');
            expect(resultAfterFillTaker).to.be.bignumber.equal('1');
            expect(resultAfterFillMaker).to.be.bignumber.equal('1');
        });

        it('should fill whole OrderRFQ and withdraw fee from maker', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 15, { from: makerWallet });
            const balanceBefore = await this.quoter.balance(this.fee.address, { from: makerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '5',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: frontendWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });
            const balanceAfter = await this.quoter.balance(this.fee.address, { from: makerWallet });

            expect(balanceBefore).to.be.bignumber.equal('15');
            expect(balanceAfter).to.be.bignumber.equal('10');
        });

        it('should fill whole OrderRFQ and withdraw fee from maker and give bonus to frontend and taker', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 400, { from: makerWallet });
            const balanceBeforeMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceBeforeFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceBeforeTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '400',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: frontendWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });
            const balanceAfterMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceAfterFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceAfterTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            expect(balanceBeforeMaker).to.be.bignumber.equal('400');
            expect(balanceAfterMaker).to.be.bignumber.equal('0');

            expect(balanceBeforeFrontend).to.be.bignumber.equal('0');
            expect(balanceAfterFrontend).to.be.bignumber.equal('100');

            expect(balanceBeforeTaker).to.be.bignumber.equal('0');
            expect(balanceAfterTaker).to.be.bignumber.equal('300');
        });

        it('should fill whole OrderRFQ and withdraw fee from maker and give bonus to frontend and owner then emit SplitTokenTransfered event', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 400, { from: makerWallet });
            const balanceBeforeMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceBeforeFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceBeforeTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '400',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: frontendWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const receipt = await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });
            const balanceAfterMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceAfterFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceAfterTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            expect(balanceBeforeMaker).to.be.bignumber.equal('400');
            expect(balanceAfterMaker).to.be.bignumber.equal('0');

            expect(balanceBeforeFrontend).to.be.bignumber.equal('0');
            expect(balanceAfterFrontend).to.be.bignumber.equal('100');

            expect(balanceBeforeTaker).to.be.bignumber.equal('0');
            expect(balanceAfterTaker).to.be.bignumber.equal('300');

            expectEvent(receipt, 'SplitTokenTransfered', { 
                from: makerWallet,
                recipient: takerWallet,
                splitTo: frontendWallet,
                token: this.fee.address,
                splitPercentage: '25',
                amount: '400',
                balance: '0'
            });
        });

        it('should fill whole OrderRFQ and withdraw fee from maker and give bonus to frontend then emit TokenTransfered event', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 400, { from: makerWallet });
            const balanceBeforeMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceBeforeFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceBeforeTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '400',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: frontendWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.quoter.setReferralBonus(0, { from: takerWallet });
            const receipt = await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });
            const balanceAfterMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceAfterFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceAfterTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            expect(balanceBeforeMaker).to.be.bignumber.equal('400');
            expect(balanceAfterMaker).to.be.bignumber.equal('0');

            expect(balanceBeforeFrontend).to.be.bignumber.equal('0');
            expect(balanceAfterFrontend).to.be.bignumber.equal('400');

            expect(balanceBeforeTaker).to.be.bignumber.equal('0');
            expect(balanceAfterTaker).to.be.bignumber.equal('0');

            expectEvent(receipt, 'TokenTransfered', { 
                from: makerWallet,
                recipient: frontendWallet,
                token: this.fee.address,
                amount: '400',
                balance: '0'
            });
        });

        it('should fill whole OrderRFQ and withdraw fees to owner if frontend address is 0', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 400, { from: makerWallet });
            const balanceBeforeMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceBeforeFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceBeforeTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '400',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });
            const balanceAfterMaker = await this.quoter.balance(this.fee.address, { from: makerWallet });
            const balanceAfterFrontend = await this.quoter.balance(this.fee.address, { from: frontendWallet });
            const balanceAfterTaker = await this.quoter.balance(this.fee.address, { from: takerWallet });

            expect(balanceBeforeMaker).to.be.bignumber.equal('400');
            expect(balanceAfterMaker).to.be.bignumber.equal('0');

            expect(balanceBeforeFrontend).to.be.bignumber.equal('0');
            expect(balanceAfterFrontend).to.be.bignumber.equal('0');

            expect(balanceBeforeTaker).to.be.bignumber.equal('0');
            expect(balanceAfterTaker).to.be.bignumber.equal('400');
        });


        it('should revert if fee amount is greater than maker balance', async function () {
            await createSessions(this.quoter);
            await this.quoter.depositToken(this.fee.address, 15, { from: makerWallet });

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: '25',
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.fee.address,
                frontendAddress: frontendWallet,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "QUOTER: insufficient maker fee",
            );
        });

        it('should bubble up revert reason on uncheckedFunctionCall', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 1500000000).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "ERC20: insufficient allowance",
            );
        });

        it('should revert if invalid function selector is provided - takerAssetData', async function () {
            await createSessions(this.quoter);

            const iface = new ethers.utils.Interface(['function foo(address bar1, address bar2, uint256 bar3) public']);
            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: iface.encodeFunctionData('foo', [takerWallet, makerWallet, 10]),
                makerAssetData: this.weth.contract.methods.transferFrom(makerWallet, takerWallet, 15).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 10, 0, { from: makerSessionWallet }),
              "QUOTER: bad TAD selector",
            );
        });

        it('should revert if invalid function selector is provided - makerAssetData', async function () {
            await createSessions(this.quoter);

            const iface = new ethers.utils.Interface(['function foo(address bar1, address bar2, uint256 bar3) public']);
            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, makerWallet, 15).encodeABI(),
                makerAssetData: iface.encodeFunctionData('foo', [makerWallet, takerWallet, 10]),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 10, 0, { from: makerSessionWallet }),
              "QUOTER: bad MAD selector",
            );
        });
    });

    describe('OrderRFQ - execution fillOrderRFQPeriphery', async function () {
        it('should fill whole order and call external contract', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });
            const callbackMock = await CallbackMock.new();

            const mockAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
            const dataABIEncoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256'], 
            [
                mockAddress, 
                '15'
            ])

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);

            const receipt = await this.quoter.fillOrderRFQCallPeriphery(
                order, 
                signature, 
                15, 
                0, 
                callbackMock.address, 
                dataABIEncoded, 
                { from: makerSessionWallet }
            );

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
            expectEvent.inTransaction(receipt.tx, CallbackMock, 'MockCallbackReceived', { 
                mockAddress: mockAddress,
                mockData: '16',
            });
        });

        it('should revert if external contract address is empty', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const mockAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
            const dataABIEncoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256'], 
            [
                mockAddress, 
                '15'
            ])

            await expectRevert(
              this.quoter.fillOrderRFQCallPeriphery(order, signature, 15, 0, zeroAddress, dataABIEncoded, {
                from: makerSessionWallet,
              }),
              "QUOTER: zero receiver address",
            );
        });

        it('should revert if external contract address is QuoterProtocolAddress', async function () {
            await createSessions(this.quoter);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const mockAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
            const dataABIEncoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256'], 
            [
                mockAddress, 
                '15'
            ])

            await expectRevert(
              this.quoter.fillOrderRFQCallPeriphery(
                order,
                signature,
                15,
                0,
                this.quoter.address,
                dataABIEncoded,
                { from: makerSessionWallet },
              ),
              "QUOTER: invalid receiver address",
            );
        });
    });

    describe('OrderRFQ - cancelation', async function () {
        it('should cancel own order', async function () {
            await this.quoter.cancelOrderRFQ('1');
            const invalidator = await this.quoter.invalidatorForOrderRFQ(takerWallet, '0');
            expect(invalidator).to.be.bignumber.equal('2');
        });

        it('should cancel own order with huge number', async function () {
            await this.quoter.cancelOrderRFQ('1023');
            const invalidator = await this.quoter.invalidatorForOrderRFQ(takerWallet, '3');
            expect(invalidator).to.be.bignumber.equal(toBN('1').shln(255));
        });

        it('should not fill cancelled order', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.quoter.cancelOrderRFQ('1', { from: takerWallet });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
              "QUOTER: already filled",
            );
        });
    });

    describe('OrderRFQ - private orders', async function () {
        it('should not fill order signed by account filling the order', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyMakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
              "QUOTER: SNE bad signature",
            );
        });

        it('should not fill order with invalid maker', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.dai.address,
                makerAsset: this.weth.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.dai.contract.methods.transferFrom(takerWallet, takerWallet, 1).encodeABI(),
                makerAssetData: this.weth.contract.methods.transferFrom(takerWallet, takerWallet, 1).encodeABI(),
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
              "QUOTER: private order",
            );
        });
    });

    describe('OrderRFQ - expiration', async function () {
        it('should fill RFQ order when not expired', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 144000).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);
            
            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should not fill RFQ order when expired', async function () {
            await createSessions(this.quoter);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp - 72000).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
              this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
              "QUOTER: order expired",
            );
        });
    });

    describe('Fee token - deposit', async function () {
        it('should deposit token', async function () {
            const balanceBefore = await this.quoter.balance(this.fee.address);
            await this.quoter.depositToken(this.fee.address, 15);
            const balanceAfter = await this.quoter.balance(this.fee.address);

            expect(balanceBefore).to.be.bignumber.equal('0');
            expect(balanceAfter).to.be.bignumber.equal('15');
            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('985');
            expect(await this.fee.balanceOf(this.quoter.address)).to.be.bignumber.equal('15');
        });

        it("should emit event TokenDeposted on deposit", async function () {
            const receipt = await this.quoter.depositToken(this.fee.address, 15);

            expectEvent(receipt, "TokenDeposited", {
                sender: takerWallet,
                token: this.fee.address,
                amount: "15",
                balance: "15",
            });
        });

        it('should revert if empty token address', async function () {
            await expectRevert(this.quoter.depositToken(zeroAddress, 15), "QUOTER: empty fee token");
        });

        it('should revert if token address is QuoterProtcol address', async function () {
            await expectRevert(
              this.quoter.depositToken(this.quoter.address, 15),
              "QUOTER: invalid fee token",
            );
        });

        it('should revert if amount is 0', async function () {
            await expectRevert(this.quoter.depositToken(this.fee.address, 0), "QUOTER: amount is 0");
        });

        it('should revert if allowance is too low', async function () {
            await expectRevert(
              this.quoter.depositToken(this.fee.address, 501),
              "ERC20: insufficient allowance",
            );
        });


        it('should revert if balance is too low', async function () {
            await expectRevert(
              this.quoter.depositToken(this.fee.address, 1001),
              "ERC20: insufficient allowance",
            );
        });
    });

    describe('Fee token - withdraw', async function () {
        it('should withdraw token', async function () {            
            await this.quoter.depositToken(this.fee.address, 15);
            const balanceBefore = await this.quoter.balance(this.fee.address);

            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('985');
            expect(await this.fee.balanceOf(this.quoter.address)).to.be.bignumber.equal('15');

            await this.quoter.withdrawToken(this.fee.address, 5);
            const balanceAfter = await this.quoter.balance(this.fee.address);

            expect(balanceBefore).to.be.bignumber.equal('15');
            expect(balanceAfter).to.be.bignumber.equal('10');

            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('990');
            expect(await this.fee.balanceOf(this.quoter.address)).to.be.bignumber.equal('10');
        });

        it("should emit event TokenWithdrawn on withdraw", async function () {
            await this.quoter.depositToken(this.fee.address, 15);
            const receipt = await this.quoter.withdrawToken(this.fee.address, 5);

            expectEvent(receipt, "TokenWithdrawn", {
                sender: takerWallet,
                token: this.fee.address,
                amount: "5",
                balance: "10",
            });
        });

        it('should revert if empty token address', async function () {
            await expectRevert(this.quoter.withdrawToken(zeroAddress, 15), "QUOTER: empty fee token");
        });

        it('should revert if token address is QuoterProtcol address', async function () {
            await expectRevert(
              this.quoter.withdrawToken(this.quoter.address, 15),
              "QUOTER: invalid fee token",
            );
        });

        it('should revert if amount is 0', async function () {
            await expectRevert(this.quoter.withdrawToken(this.fee.address, 0), "QUOTER: amount is 0");
        });

        it('should revert if balance is too low', async function () {
            await expectRevert(
              this.quoter.withdrawToken(this.fee.address, 5),
              "QUOTER: insufficient balance",
            );
        });
    });

    describe("QUOTER-PM ownership", async function () {
      it("mutableOwner should return current PM owner", async function () {
        const owner = await this.quoter.mutableOwner();

        expect(owner).to.be.eq(takerWallet);
      });

      it("transferOwnership should transfer ownership of PM to another address", async function () {
        const ownerBefore = await this.quoter.mutableOwner();
        await this.quoter.transferOwnership(ownerWalletNew, { from: takerWallet });
        const ownerAfter = await this.quoter.mutableOwner();

        expect(ownerBefore).to.be.eq(takerWallet);
        expect(ownerAfter).to.be.eq(ownerWalletNew);
      });

      it("transferOwnership should revert if called by not an owner", async function () {
        expectRevert(
          this.quoter.transferOwnership(ownerWalletNew, { from: makerWallet }),
          "MO: Access denied",
        );
      });
    });

    describe("QUOTER referral bonus", async function () {
      it("setReferralBonus should set new splt bonus", async function () {
        const bonusBefore = await this.quoter.getSplitBonus();
        await this.quoter.setReferralBonus(55, { from: takerWallet });
        const bonusAfter = await this.quoter.getSplitBonus();

        expect(bonusBefore).to.be.bignumber.equal("25");
        expect(bonusAfter).to.be.bignumber.equal("55");
      });

      it("setReferralBonus should revert if called by not an owner", async function () {
        expectRevert(this.quoter.setReferralBonus(55, { from: makerWallet }), "MO: Access denied");
      });
    });

    describe('Proxies', async function () {
        it('ERC721Proxy should work', async function () {
            await createSessions(this.quoter);

            const order = {
                info: generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()),
                feeAmount: 0,
                takerAsset: this.quoter.address,
                makerAsset: this.quoter.address,
                feeTokenAddress: this.weth.address,
                frontendAddress: zeroAddress,
                takerAssetData: this.quoter.contract.methods.func_602HzuS(takerWallet, makerWallet, 15, this.dai.address).encodeABI(),
                makerAssetData: this.quoter.contract.methods.func_602HzuS(makerWallet, takerWallet, 15, this.weth.address).encodeABI()
            };
            const data = buildOrderRFQData(this.chainId, this.quoter.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);
            
            await this.quoter.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });
    });
});