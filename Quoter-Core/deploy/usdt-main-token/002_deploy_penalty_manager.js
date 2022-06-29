require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_PM_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const ownerPublicKey = process.env.OWNER_PUBLIC_KEY;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
  const { deploy, execute } = deployments;

  const penaltyToken = process.env.PENALTY_TOKEN_ADDRESS;
  await deploy("QuoterPenaltyManager", {
    from: privateKey,
    args: [penaltyToken, splitBonus, ownerPublicKey],
    // gasLimit: 2500000,
    // estimatedGasLimit: 2500000,
    log: true,
  });
};
module.exports.tags = ["Quoter-PM-USDT"];
module.exports.dependencies = ["Quoter-Core-USDT"];
