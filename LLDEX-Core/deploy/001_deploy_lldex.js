require("dotenv").config();

const splitBonus = Number(process.env.LLDEX_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

async function deployLLDEXToken(deployments) {
  const { deploy, execute } = deployments;

  await deploy("LLDEXToken", {
    from: privateKey,
    args: [],
    log: true,
  });

  await execute(
    "LLDEXProtocol",
    { from: privateKey, log: true },
    "mint",
    "0x99A36FDfBfee036fAB258ff8e48f2390c77F3C71",
    "15000000000000000000000000",
  );
}

module.exports = async ({getNamedAccounts, deployments}) => {
  const { deploy, execute } = deployments;

  await deploy("LLDEXProtocol", {
    from: privateKey,
    args: [splitBonus],
    log: true,
  });

  //await deployLLDEXToken(deployments);
};
module.exports.tags = ["LLDEX-Core"];
