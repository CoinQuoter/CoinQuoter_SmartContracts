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
              runs: 10
            }
          },
        },
      ],
  }
};
