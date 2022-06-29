require("dotenv").config();

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;

  await deploy("ZeroExBridge", {
    from: privateKey,
    args: [
      "0x76540F7e38dFCdF3b39A501Bb7ef77c3705f4F17",
      "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
      "0xA4CcEF1A4f039346DD72115a958712A65BF2f155",
    ],
    log: true,
  });
};
module.exports.tags = ["ZeroEx-Bridge"];
