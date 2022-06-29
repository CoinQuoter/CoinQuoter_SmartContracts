require("dotenv").config();
const Selector = require("./000_helper_selector");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;

  const sushiswapRouterAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
  const zeroExProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";

  const quoterProtocolAddress = "0x76540F7e38dFCdF3b39A501Bb7ef77c3705f4F17";

  await deploy("CoreRouter", {
    from: privateKey,
    args: [quoterProtocolAddress, process.env.TEMP_OWNER_PUBLIC_KEY],
    log: true,
  });

  // 0x
  await execute("CoreRouter", { from: privateKey, log: true, gasLimit: 500000 }, "addMarket", [
    zeroExProxyAddress,
    Selector.MarketSelectors.ZeroEx,
  ]);

  // Sushiswap
  await execute("CoreRouter", { from: privateKey, log: true, gasLimit: 500000 }, "addMarket", [
    sushiswapRouterAddress,
    Selector.MarketSelectors.Sushiswap,
  ]);

  await execute(
    "CoreRouter",
    { from: privateKey, log: true, gasLimit: 500000 },
    "transferOwnership",
    process.env.OWNER_PUBLIC_KEY,
  );
};
module.exports.tags = ["Core-Router-BSC"];
