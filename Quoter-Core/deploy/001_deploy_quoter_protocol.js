require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

async function deployQuoterToken(deployments) {
  const { deploy, execute } = deployments;

  await deploy("QuoterToken", {
    from: privateKey,
    args: [],
    log: true,
  });
}

module.exports = async ({getNamedAccounts, deployments}) => {
  const { deploy, execute } = deployments;

  await deploy("QuoterProtocol", {
    from: privateKey,
    args: [splitBonus],
    log: true,
  });

  await deployQuoterToken(deployments);
};
module.exports.tags = ["Quoter-Core"];
