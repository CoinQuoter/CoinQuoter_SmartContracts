require("dotenv").config();

const splitBonus = Number(process.env.QUOTER_DEFAULT_BONUS);
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const ownerPublicKey = process.env.OWNER_PUBLIC_KEY;

async function deployQuoterToken(deployments) {
  const { deploy, execute } = deployments;

  await deploy("QuoterToken", {
    from: privateKey,
    args: [ownerPublicKey],
    log: true,
  });
}

module.exports = async ({getNamedAccounts, deployments}) => {
  const { deploy, execute } = deployments;

  await deploy("QuoterProtocol", {
    from: privateKey,
    args: [splitBonus, ownerPublicKey],
    log: true,
  });

  await deployQuoterToken(deployments);
};
module.exports.tags = ["Quoter-Core"];
