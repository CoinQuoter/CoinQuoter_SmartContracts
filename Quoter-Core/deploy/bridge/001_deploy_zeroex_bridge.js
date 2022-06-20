require("dotenv").config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;

  await deploy("ZeroExBridge", {
    from: privateKey,
    args: [
      "0x3b18110BB9142263C1b7A49A94C4433336bF0D8a",
      "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
      "0xA4CcEF1A4f039346DD72115a958712A65BF2f155",
    ],
    log: true,
  });
};
module.exports.tags = ["ZeroEx-Bridge"];
