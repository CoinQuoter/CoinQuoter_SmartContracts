
require('hardhat-contract-sizer');
require('solidity-coverage')
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-truffle5');
require('hardhat-deploy');
require("dotenv").config();

const safeProtocolAddress = process.env.GNOSIS_SAFE_PROTOCOL_ADDRESS;
const safeTokenAddress = process.env.GNOSIS_SAFE_TOKEN_ADDRESS;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
    },
    harmony_testnet_shard0: {
      url: "https://api.s0.b.hmny.io",
      chainId: 1666700000,
      saveDeployments: true,
      tags: ["harmony_test_s0"],
    },
    harmony_mainnet_shard0: {
      url: "https://harmony-0-rpc.gateway.pokt.network/",
      chainId: 1666600000,
      saveDeployments: true,
      tags: ["harmony_mainnet_s0"],
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      saveDeployments: true,
      tags: ["bsc_testnet"],
    },
  },
  namedAccounts: {
    safeProtocol: safeProtocolAddress,
    safeToken: safeTokenAddress
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  gasReporter: {
    enable: false,
    currency: "USD",
  },
};
