
require('hardhat-contract-sizer');
require('solidity-coverage')
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-truffle5');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers:
      [
        {
          version: "0.8.0",
          settings: {
            optimizer: {
              enabled: true,
              runs: 10000
            }
          },
        },
      ],
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0
    }
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  gasReporter: {
      enable: false,
      currency: 'USD',
  },
};
