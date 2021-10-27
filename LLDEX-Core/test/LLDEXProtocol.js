const { expectRevert, BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { bufferToHex } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const TokenMock = artifacts.require('TokenMock');
const WrappedTokenMock = artifacts.require('WrappedTokenMock');
const LLDEXProtocol = artifacts.require('LLDEXProtocol');

const { profileEVM, gasspectEVM } = require('./helpers/profileEVM');
const { buildOrderData, buildOrderRFQData } = require('./helpers/orderUtils');
const { toBN } = require('./helpers/utils');

contract('LLDEXProtocol', async function ([addr1, wallet]) {
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    /*
        LLDEX maker, taker walelts
    */
    const privateKeyMaker = 'd7ef8e75a07118180d829c2884f419650f084ab7c700eec44ec982814822f2a1';
    const privateKeyTaker = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

    const takerWallet = Wallet.fromPrivateKey(Buffer.from(privateKeyTaker, 'hex'));
    const makerWallet = Wallet.fromPrivateKey(Buffer.from(privateKeyMaker, 'hex'));

    /*
        LLDEX session system wallets
    */
    const privateKeyMakerSession = '4641f744c44e9d06037aa3b5061abf40c20a537ddb0c46f453715d504fa27034';
    const privateKeyTakerSession = '4a6f074e6df2051e27506e4836b9898394bb2cf83bccfb6b94d53ffd2e5f351f';

    const takerSessionWallet = Wallet.fromPrivateKey(Buffer.from(privateKeyMakerSession, 'hex'));
    const makerSessionWallet = Wallet.fromPrivateKey(Buffer.from(privateKeyTakerSession, 'hex'));

    const expireIn = '';

    function buildOrderRFQ (info, takerAsset, makerAsset, takerAmount, makerAmount, maker = zeroAddress) {
        return {
            info: info,
            feeAmount: 0,
            takerAsset: takerAsset.address,
            makerAsset: makerAsset.address,
            feeTokenAddress: zeroAddress,
            frontendAddress: zeroAddress,
            takerAssetData: takerAsset.contract.methods.transferFrom(wallet, maker, takerAmount).encodeABI(),
            makerAssetData: makerAsset.contract.methods.transferFrom(maker, wallet, makerAmount).encodeABI(),
        };
    }

    beforeEach(async function () {
        this.dai = await TokenMock.new('DAI', 'DAI');
        this.weth = await WrappedTokenMock.new('WETH', 'WETH');

        this.swap = await LLDEXProtocol.new();
        await this.swap.createOrUpdateSession(takerSessionWallet.getAddressString(), '0', { from: takerWallet })
        await this.swap.createOrUpdateSession(makerSessionWallet.getAddressString(), '0',{ from: makerWallet })

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await this.dai.getChainId();

        await this.dai.mint(wallet, '1000000');
        await this.weth.mint(wallet, '1000000');
        await this.dai.mint(addr1, '1000000');
        await this.weth.mint(addr1, '1000000');

        await this.dai.approve(this.swap.address, '1000000');
        await this.weth.approve(this.swap.address, '1000000');
        await this.dai.approve(this.swap.address, '1000000', { from: wallet });
        await this.weth.approve(this.swap.address, '1000000', { from: wallet });
    });

    describe('wip', async function () {
        it('transferFrom', async function () {
            await this.dai.approve(addr1, '2', { from: wallet });
            await this.dai.transferFrom(wallet, addr1, '1', { from: addr1 });
        });

        it('should swap fully based on RFQ signature', async function () {
            // Order: 1 DAI => 1 WETH
            // Swap:  1 DAI => 1 WETH

            for (const salt of ['000000000000000000000001', '000000000000000000000002']) {
                const order = buildOrderRFQ(salt, this.dai, this.weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

                const takerDai = await this.dai.balanceOf(wallet);
                const makerDai = await this.dai.balanceOf(addr1);
                const takerWeth = await this.weth.balanceOf(wallet);
                const makerWeth = await this.weth.balanceOf(addr1);

                const receipt = await this.swap.fillOrderRFQ(order, signature, 1, 0);

                expect(
                    await profileEVM(receipt.tx, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
                ).to.be.deep.equal([2, 1, 7, 7, 2]);

                await gasspectEVM(receipt.tx);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(takerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(makerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(takerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(makerWeth.subn(1));
            }
        });
    });

    describe('OrderRFQ Cancelation', async function () {
        it('should cancel own order', async function () {
            await this.swap.cancelOrderRFQ('1');
            const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '0');
            expect(invalidator).to.be.bignumber.equal(toBN('2'));
        });

        it('should cancel own order with huge number', async function () {
            await this.swap.cancelOrderRFQ('1023');
            const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '3');
            expect(invalidator).to.be.bignumber.equal(toBN('1').shln(255));
        });

        it('should not fill cancelled order', async function () {
            const order = buildOrderRFQ('1', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            await this.swap.cancelOrderRFQ('1', { from: wallet });

            await expectRevert(
                this.swap.fillOrderRFQ(order, signature, 1, 0),
                'LOP: already filled',
            );
        });
    });

    describe('Private Orders', async function () {
        it('should fill with correct maker', async function () {
            const order = buildOrderRFQ(this.swap, this.dai, this.weth, 1, 1, addr1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            const takerDai = await this.dai.balanceOf(wallet);
            const makerDai = await this.dai.balanceOf(addr1);
            const takerWeth = await this.weth.balanceOf(wallet);
            const makerWeth = await this.weth.balanceOf(addr1);

            await this.swap.fillOrder(order, signature, 1, 0, 1);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should not fill with incorrect maker', async function () {
            const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, wallet);
            const data = buildOrderData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            await expectRevert(
                this.swap.fillOrder(order, signature, 1, 0, 1),
                'LOP: private order',
            );
        });
    });

    describe('Expiration', async function () {
        it('should fill RFQ order when not expired', async function () {
            const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            const takerDai = await this.dai.balanceOf(wallet);
            const makerDai = await this.dai.balanceOf(addr1);
            const takerWeth = await this.weth.balanceOf(wallet);
            const makerWeth = await this.weth.balanceOf(addr1);

            await this.swap.fillOrderRFQ(order, signature, 1, 0);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should partial fill RFQ order', async function () {
            const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 2, 2);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            const takerDai = await this.dai.balanceOf(wallet);
            const makerDai = await this.dai.balanceOf(addr1);
            const takerWeth = await this.weth.balanceOf(wallet);
            const makerWeth = await this.weth.balanceOf(addr1);

            await this.swap.fillOrderRFQ(order, signature, 1, 0);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should fully fill RFQ order', async function () {
            const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            const takerDai = await this.dai.balanceOf(wallet);
            const makerDai = await this.dai.balanceOf(addr1);
            const takerWeth = await this.weth.balanceOf(wallet);
            const makerWeth = await this.weth.balanceOf(addr1);

            await this.swap.fillOrderRFQ(order, signature, 0, 0);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(takerDai.subn(1));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(makerDai.addn(1));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(takerWeth.addn(1));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(makerWeth.subn(1));
        });

        it('should not partial fill RFQ order when 0', async function () {
            const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 5, 10);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            await expectRevert(
                this.swap.fillOrderRFQ(order, signature, 0, 1),
                'LOP: can\'t swap 0 amount',
            );
        });

        it('should not fill RFQ order when expired', async function () {
            const order = buildOrderRFQ('308276084001730439550074881', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(takerWallet.getPrivateKey(), { data });

            await expectRevert(
                this.swap.fillOrderRFQ(order, signature, 1, 0),
                'LOP: order expired',
            );
        });
    });

});