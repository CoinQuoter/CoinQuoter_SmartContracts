require("dotenv").config();

const splitBonus = Number(process.env.LLDEX_PM_DEFAULT_BONUS);
const defaultCollector = process.env.LLDEX_PM_DEFAULT_COLLECTOR;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, ethers, deployments }) => {
    const { deploy, execute } = deployments;

    const lldex = await deployments.get("LLDEXProtocol");
    await deploy("LLDEXPenaltyManager", {
        from: privateKey,
        args: [lldex.address, splitBonus],
        log: true,
    });

    console.log(defaultCollector);

    await execute("LLDEXPenaltyManager", { from: privateKey, log: true }, "addCollector", 
      defaultCollector,
    );
};
module.exports.tags = ["LLDEX-PM"];
module.exports.dependencies = ["LLDEX-Core"];
