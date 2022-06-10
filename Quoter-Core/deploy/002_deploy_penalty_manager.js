require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_PM_DEFAULT_BONUS);
const defaultCollector = process.env.QUOTER_PM_DEFAULT_COLLECTOR;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const deployerPublicKey = process.env.DEPLOYER_PUBLIC_KEY;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
  const { deploy, execute } = deployments;

  const quoterTokenAddress = (await deployments.get("QuoterToken")).address
  await deploy("QuoterPenaltyManager", {
    from: privateKey,
    args: [quoterTokenAddress, splitBonus, deployerPublicKey],
    log: true,
  });

  // await execute(
  //   "QuoterPenaltyManager",
  //   { from: privateKey, log: true },
  //   "addCollector",
  //   defaultCollector,
  // );
};
module.exports.tags = ["Quoter-PM"];
module.exports.dependencies = ["Quoter-Core"];
