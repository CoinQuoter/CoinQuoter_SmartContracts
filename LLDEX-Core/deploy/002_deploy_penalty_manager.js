require("dotenv").config();

const splitBonus = Number(process.env.LLDEX_PM_DEFAULT_BONUS);
const defaultCollector = process.env.LLDEX_PM_DEFAULT_COLLECTOR;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
  const { deploy, execute } = deployments;

  //await deployments.get("LLDEXToken")
  const lldexTokenAddress = "0x65e3E8A0218F56858DDD669eF2B2e42f928749cD";
  await deploy("LLDEXPenaltyManager", {
    from: privateKey,
    args: [lldexTokenAddress, splitBonus],
    log: true,
  });

  console.log(defaultCollector);

  await execute(
    "LLDEXPenaltyManager",
    { from: privateKey, log: true },
    "addCollector",
    defaultCollector,
  );
};
module.exports.tags = ["LLDEX-PM"];
module.exports.dependencies = ["LLDEX-Core"];
