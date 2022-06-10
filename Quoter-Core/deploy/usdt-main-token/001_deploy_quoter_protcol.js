require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const deployerPublicKey = process.env.DEPLOYER_PUBLIC_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;

//   await deploy("QuoterProtocol", {
//     from: privateKey,
//     args: [splitBonus, deployerPublicKey],
//     // gasLimit: 4500000,
//     // estimatedGasLimit: 4500000,
//     log: true,
//   });
};
module.exports.tags = ["Quoter-Core-USDT"];
