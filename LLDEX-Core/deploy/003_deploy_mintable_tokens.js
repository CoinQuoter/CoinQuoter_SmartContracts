require("dotenv").config();

const splitBonus = Number(process.env.LLDEX_PM_DEFAULT_BONUS);
const defaultCollector = process.env.LLDEX_PM_DEFAULT_COLLECTOR;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
  const { deploy, execute } = deployments;

  const lldex = await deployments.get("LLDEXProtocol");
  await deploy("USDTToken", {
    from: privateKey,
    args: [],
    log: true,
  });

  await deploy("WBNBToken", {
    from: privateKey,
    args: [],
    log: true,
  });

  await deploy("WBTCToken", {
    from: privateKey,
    args: [],
    log: true,
  });

  await deploy("WETHToken", {
    from: privateKey,
    args: [],
    log: true,
  });
};
module.exports.tags = ["LLDEX-Tokens"];
module.exports.dependencies = ["LLDEX-PM"];
