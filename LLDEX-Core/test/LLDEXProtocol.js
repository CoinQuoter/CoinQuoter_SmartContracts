const { expectRevert, expectEvent, BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ethSigUtil = require('eth-sig-util');
const TokenMock = artifacts.require('TokenMock');
const LLDEXProtocol = artifacts.require('LLDEXProtocol');

const { buildOrderRFQData, generateRFQOrderInfo } = require('./helpers/orderUtils');
const { toBN } = require('./helpers/Utils.js');

contract('LLDEXProtocol', async function ([takerWallet, makerWallet, takerSessionWallet, makerSessionWallet]) {

    /*
        LLDEX session wallets
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

    async function createSessions(lldex) {
        await lldex.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet })
        await lldex.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })
    }

    beforeEach(async function () {
        this.fee = await TokenMock.new('LLDEX Token', 'LLDEX');
        this.dai = await TokenMock.new('DAI Token', 'DAI');
        this.weth = await TokenMock.new('WETH Token', 'WETH');

        this.lldex = await LLDEXProtocol.new();

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await this.dai.getChainId();

        await this.dai.mint(makerWallet, '1000000');
        await this.weth.mint(makerWallet, '1000000');
        await this.dai.mint(takerWallet, '1000000');
        await this.weth.mint(takerWallet, '1000000');

        await this.dai.approve(this.lldex.address, '1000000');
        await this.weth.approve(this.lldex.address, '1000000');
        await this.dai.approve(this.lldex.address, '1000000', { from: makerWallet });
        await this.weth.approve(this.lldex.address, '1000000', { from: makerWallet });

        // Fee token
        await this.fee.mint(makerWallet, '1000');
        await this.fee.mint(takerWallet, '1000');

        await this.fee.approve(this.lldex.address, '500', { from: takerWallet });
        await this.fee.approve(this.lldex.address, '500', { from: makerWallet });
    });

    describe('Session system - createOrUpdateSession', async function () {
        it('createOrUpdateSession should create sessions', async function () {
            await createSessions(this.lldex);

            const takerExpirationTimestamp = await this.lldex.sessionExpirationTime(takerWallet);
            const makerExpirationTimestamp = await this.lldex.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
        });

        it('createOrUpdateSession should update session', async function () {
            await createSessions(this.lldex);

            const expireInForwarded = expireInTimestamp + 3600;

            await this.lldex.createOrUpdateSession(takerSessionWallet, expireInForwarded, { from: takerWallet })
            await this.lldex.createOrUpdateSession(makerSessionWallet, expireInForwarded, { from: makerWallet })

            const takerExpirationTimestamp = await this.lldex.sessionExpirationTime(takerWallet);
            const makerExpirationTimestamp = await this.lldex.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInForwarded.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInForwarded.toString());
        });

        it('createOrUpdateSession should revert if session timestamp is below block.timestamp', async function () {
            expectRevert(
                this.lldex.createOrUpdateSession(takerSessionWallet, blockchainTimestamp - 3600, { from: takerWallet }),
                'LLDEX: invalid expiration time'
            );
        });

        it('createOrUpdateSession should revert if session key is 0', async function () {
            expectRevert(
                this.lldex.createOrUpdateSession(zeroAddress, blockchainTimestamp - 3600, { from: takerWallet }),
                'LLDEX: SK is empty'
            );
        });

        it('createOrUpdateSession should revert if session key is contract address', async function () {
            expectRevert(
                this.lldex.createOrUpdateSession(this.lldex.address, blockchainTimestamp - 3600, { from: takerWallet }),
                'LLDEX: invalid SK'
            );
        });

        it('createOrUpdateSession should revert if session key is msg.sender', async function () {
            expectRevert(
                this.lldex.createOrUpdateSession(takerWallet, blockchainTimestamp - 3600, { from: takerWallet }),
                'LLDEX: invalid SK - sender'
            );
        });

        it('createOrUpdateSession should emit SessionCreated on session creation', async function () {
            const receipt = await this.lldex.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet });

            expectEvent(receipt, 'SessionCreated', { 
                creator: takerWallet,
                sessionKey: takerSessionWallet,
                expirationTime: expireInTimestamp.toString()
            });
        });

        it('createOrUpdateSession should emit SessionUpdated on session update', async function () {
            const expireInForwarded = expireInTimestamp + 3600;
            await this.lldex.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet });
            const receipt = await this.lldex.createOrUpdateSession(takerSessionWallet, expireInForwarded, { from: takerWallet });

            expectEvent(receipt, 'SessionUpdated', { 
                sender: takerWallet,
                sessionKey: takerSessionWallet,
                expirationTime: expireInForwarded.toString()
            });
        });
    });

    describe('Session system - sessionExpirationTime, session', async function() {
                it('sessionExpirationTime should return session expiration time', async function () {
            await createSessions(this.lldex);

            expect(await this.lldex.sessionExpirationTime(takerWallet)).to.be.bignumber.equal(expireInTimestamp.toString());
        });

        it('session should return session data', async function () {
            await createSessions(this.lldex);

            const result = await this.lldex.session(takerWallet);

            expect(result).to.include({
                creator: takerWallet,
                sessionKey: takerSessionWallet,
            })
            expect(result.expirationTime).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(result.txCount).to.be.bignumber.equal('0');
        });

        it('session should return empty data if no session', async function () {
            const result = await this.lldex.session(takerWallet);

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
            await createSessions(this.lldex);

            var takerExpirationTimestamp = await this.lldex.sessionExpirationTime(takerWallet);
            var makerExpirationTimestamp = await this.lldex.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());
            expect(makerExpirationTimestamp).to.be.bignumber.equal(expireInTimestamp.toString());

            await this.lldex.endSession({ from: takerWallet });
            await this.lldex.endSession({ from: makerWallet });

            takerExpirationTimestamp = await this.lldex.sessionExpirationTime(takerWallet);
            makerExpirationTimestamp = await this.lldex.sessionExpirationTime(makerWallet);

            expect(takerExpirationTimestamp).to.be.bignumber.equal('0');
            expect(makerExpirationTimestamp).to.be.bignumber.equal('0');
        });

        it('endSession should emit SessionTerminated on session termination', async function () {
            await createSessions(this.lldex);
            const receipt = await this.lldex.endSession({ from: takerWallet });

            expectEvent(receipt, 'SessionTerminated', { 
                sender: takerWallet,
                sessionKey: takerSessionWallet,
            });
        });

        it('endSession should revert if session has been terminated', async function () {
            await createSessions(this.lldex);
            await this.lldex.endSession({ from: takerWallet });

            await expectRevert(
                this.lldex.endSession({ from: takerWallet }),
                'LLDEX: invalid session',
            );
        });

        it('endSession should revert if session is expired', async function () {
            await createSessions(this.lldex);
            await increaseTime(7200);

            await expectRevert(
                this.lldex.endSession({ from: takerWallet }),
                'LLDEX: session expired',
            );

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
            await createSessions(this.lldex);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);

            await this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should fill whole OrderRFQ if takingAmount and makingAmount is 0', async function () {
            await createSessions(this.lldex);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);

            await this.lldex.fillOrderRFQ(order, signature, 0, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should partial fill RFQ order', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 2, 2);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const takerDai = await this.dai.balanceOf(makerWallet);
            const makerDai = await this.dai.balanceOf(takerWallet);
            const takerWeth = await this.weth.balanceOf(makerWallet);
            const makerWeth = await this.weth.balanceOf(takerWallet);

            await this.lldex.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should revert partial fill RFQ order when takingAmount is 0', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 5, 10);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 0, 1),
                'LLDEX: one amount should be 0',
            );
        });

        it('should revert filling RFQ order when takingAmount execeeds order taking amount', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 16, 0),
                'LLDEX: taking amount exceeded',
            );
        });

        it('should not fill order without taker and maker session', async function () {
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }), 'LLDEX: expired maker session');
        });

        it('should not fill order without maker session', async function () {
            await this.lldex.createOrUpdateSession(takerSessionWallet, expireInTimestamp, { from: takerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }), 'LLDEX: expired maker session');
        });

        it('should not fill order without taker session and without valid taker signature (signed by original taker)', async function () {
            await this.lldex.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            expectRevert(this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }), 'LLDEX: SE bad signature');
        });

        it('should fill order if order is signed by original taker (not taker session key)', async function () {
            await this.lldex.createOrUpdateSession(makerSessionWallet, expireInTimestamp, { from: makerWallet })

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTaker, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);
            
            await this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should emit event OrderFilledRFQ after filling order', async function () {
            await createSessions(this.lldex);
            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const receipt = await this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expectEvent(receipt, 'OrderFilledRFQ', { 
                takingAmount: '15',
                makingAmount: '15'
            });
        });

        it('should update transaction count of sessions', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const resultBeforeFillTaker = (await this.lldex.session(takerWallet)).txCount;
            const resultBeforeFillMaker = (await this.lldex.session(makerWallet)).txCount;

            await this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            const resultAfterFillTaker = (await this.lldex.session(takerWallet)).txCount;
            const resultAfterFillMaker = (await this.lldex.session(makerWallet)).txCount;


            expect(resultBeforeFillTaker).to.be.bignumber.equal('0');
            expect(resultBeforeFillMaker).to.be.bignumber.equal('0');
            expect(resultAfterFillTaker).to.be.bignumber.equal('1');
            expect(resultAfterFillMaker).to.be.bignumber.equal('1');
        });
    });

    describe('OrderRFQ - cancelation', async function () {
        it('should cancel own order', async function () {
            await this.lldex.cancelOrderRFQ('1');
            const invalidator = await this.lldex.invalidatorForOrderRFQ(takerWallet, '0');
            expect(invalidator).to.be.bignumber.equal('2');
        });

        it('should cancel own order with huge number', async function () {
            await this.lldex.cancelOrderRFQ('1023');
            const invalidator = await this.lldex.invalidatorForOrderRFQ(takerWallet, '3');
            expect(invalidator).to.be.bignumber.equal(toBN('1').shln(255));
        });

        it('should not fill cancelled order', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await this.lldex.cancelOrderRFQ('1', { from: takerWallet });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
                'LLDEX: already filled',
            );
        });
    });

    describe('OrderRFQ - private orders', async function () {
        it('should not fill order signed by account filling the order', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 7200).toString()), this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyMakerSession, { data });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
                'LLDEX: SNE bad signature',
            );
        });

        it('should not fill order with invalid maker', async function () {
            await createSessions(this.lldex);

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
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 1, 0, { from: makerSessionWallet }),
                'LLDEX: private order',
            );
        });
    });

    describe('OrderRFQ - expiration', async function () {
        it('should fill RFQ order when not expired', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp + 144000).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            const makerDai = await this.dai.balanceOf(makerWallet);
            const takerDai = await this.dai.balanceOf(takerWallet);
            const makerWeth = await this.weth.balanceOf(makerWallet);
            const takerWeth = await this.weth.balanceOf(takerWallet);
            
            await this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet });

            expect(await this.dai.balanceOf(takerWallet)).to.be.bignumber.equal(takerDai.subn(15));
            expect(await this.dai.balanceOf(makerWallet)).to.be.bignumber.equal(makerDai.addn(15));
            expect(await this.weth.balanceOf(takerWallet)).to.be.bignumber.equal(takerWeth.addn(15));
            expect(await this.weth.balanceOf(makerWallet)).to.be.bignumber.equal(makerWeth.subn(15));
        });

        it('should not fill RFQ order when expired', async function () {
            await createSessions(this.lldex);

            const order = buildOrderRFQ(generateRFQOrderInfo('1', (expireInTimestamp - 72000).toString()), this.dai, this.weth, 15, 15);
            const data = buildOrderRFQData(this.chainId, this.lldex.address, order);
            const signature = ethSigUtil.signTypedMessage(privateKeyTakerSession, { data });

            await expectRevert(
                this.lldex.fillOrderRFQ(order, signature, 15, 0, { from: makerSessionWallet }),
                'LLDEX: order expired',
            );
        });
    });

    describe('Fee token - deposit', async function () {
        it('should deposit token', async function () {
            const balanceBefore = await this.lldex.balance(this.fee.address);
            await this.lldex.depositToken(this.fee.address, 15);
            const balanceAfter = await this.lldex.balance(this.fee.address);

            expect(balanceBefore).to.be.bignumber.equal('0');
            expect(balanceAfter).to.be.bignumber.equal('15');
            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('985');
            expect(await this.fee.balanceOf(this.lldex.address)).to.be.bignumber.equal('15');
        });

        it('should revert if empty token address', async function () {
            await expectRevert(
                this.lldex.depositToken(zeroAddress, 15),
                'LLDEX: empty fee token'
            )
        });

        it('should revert if token address is LLDEXProtcol address', async function () {
            await expectRevert(
                this.lldex.depositToken(this.lldex.address, 15),
                'LLDEX: invalid fee token'
            )
        });

        it('should revert if amount is 0', async function () {
            await expectRevert(
                this.lldex.depositToken(this.fee.address, 0),
                'LLDEX: amount is 0'
            )
        });

        it('should revert if allowance is too low', async function () {
            await expectRevert(
                this.lldex.depositToken(this.fee.address, 501),
                'ERC20: transfer amount exceeds allowance'
            )
        });


        it('should revert if balance is too low', async function () {
            await expectRevert(
                this.lldex.depositToken(this.fee.address, 1001),
                'ERC20: transfer amount exceeds balance'
            )
        });
    });

    describe('Fee token - withdraw', async function () {
        it('should withdraw token', async function () {            
            await this.lldex.depositToken(this.fee.address, 15);
            const balanceBefore = await this.lldex.balance(this.fee.address);

            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('985');
            expect(await this.fee.balanceOf(this.lldex.address)).to.be.bignumber.equal('15');

            await this.lldex.withdrawToken(this.fee.address, 5);
            const balanceAfter = await this.lldex.balance(this.fee.address);

            expect(balanceBefore).to.be.bignumber.equal('15');
            expect(balanceAfter).to.be.bignumber.equal('10');

            expect(await this.fee.balanceOf(takerWallet)).to.be.bignumber.equal('990');
            expect(await this.fee.balanceOf(this.lldex.address)).to.be.bignumber.equal('10');
        });

        it('should revert if empty token address', async function () {
            await expectRevert(
                this.lldex.withdrawToken(zeroAddress, 15),
                'LLDEX: empty fee token'
            )
        });

        it('should revert if token address is LLDEXProtcol address', async function () {
            await expectRevert(
                this.lldex.withdrawToken(this.lldex.address, 15),
                'LLDEX: invalid fee token'
            )
        });

        it('should revert if amount is 0', async function () {
            await expectRevert(
                this.lldex.withdrawToken(this.fee.address, 0),
                'LLDEX: amount is 0'
            )
        });

        it('should revert if balance is too low', async function () {
            await expectRevert(
                this.lldex.withdrawToken(this.fee.address, 5),
                'LLDEX: insufficient balance'
            )
        });
    });
});