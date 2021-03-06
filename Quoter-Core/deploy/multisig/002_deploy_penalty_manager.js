require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_PM_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const defaultCollector = process.env.QUOTER_PM_DEFAULT_COLLECTOR;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
    const { deploy, execute } = deployments;
    const { safeProtocol } = await getNamedAccounts();

    const quoterTokenAddress = '0x0b0354497Cf397BB66233D8B4bC8B4fc010bc274';
    //(await deployments.get("QuoterToken")).address;
    await deploy("QuoterPenaltyManager", {
      from: privateKey,
      args: [quoterTokenAddress, splitBonus, safeProtocol],
      log: true,
    });

    //await execute("QuoterPenaltyManager", { from: privateKey, log: true }, "addCollector", defaultCollector);
};
module.exports.tags = ["Quoter-PM-Multisig"];
module.exports.dependencies = ["Quoter-Core-Multisig"];
