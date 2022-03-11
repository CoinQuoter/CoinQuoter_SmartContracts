require("dotenv").config();

const splitBonus = Number(process.env.LLDEX_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({getNamedAccounts, deployments}) => {
  const { deploy } = deployments;

  await deploy("LLDEXProtocol", {
    from: privateKey,
    args: [splitBonus],
    log: true,
  });

  await deploy("LLDEXToken", {
    from: privateKey,
    args: [],
    log: true,
  });
};
module.exports.tags = ["LLDEX-Core"];
