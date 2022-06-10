require("dotenv").config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;

  await deploy("OneInchBridge", {
    from: privateKey,
    args: ["0x3b18110BB9142263C1b7A49A94C4433336bF0D8a", "0x1111111254fb6c44bac0bed2854e76f90643097d"],
    log: true,
  });
};
module.exports.tags = ["OneInch-Bridge"];
