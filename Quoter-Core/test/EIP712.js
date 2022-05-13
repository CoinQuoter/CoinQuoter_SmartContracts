const { domainSeparator } = require('./helpers/eip712');
const { name, version } = require('./helpers/orderUtils');

const TokenMock = artifacts.require('TokenMock');
const QuoterProtocol = artifacts.require('QuoterProtocol');

describe('QuoterProtocol-EIP712', async function () {
    beforeEach(async function () {
        this.token = await TokenMock.new('-', '-');
        this.protocol = await QuoterProtocol.new(25, "0x0000000000000000000000000000000000000000");

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await this.token.getChainId();
    });

    it('domain separator', async function () {
        expect(await this.protocol.DOMAIN_SEPARATOR()).to.equal(
          domainSeparator(name, version, this.chainId, this.protocol.address),
        );
    });
});