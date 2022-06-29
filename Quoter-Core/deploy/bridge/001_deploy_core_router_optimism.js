require("dotenv").config();
const Selector = require("./000_helper_selector");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;

  const uniswapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const zeroExProxyAddress = "0xdef1abe32c034e558cdd535791643c58a13acc10";

  const quoterProtocolAddress = "0x3b18110BB9142263C1b7A49A94C4433336bF0D8a";

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

  // Uniswap
  await execute("CoreRouter", { from: privateKey, log: true, gasLimit: 500000 }, "addMarket", [
    uniswapRouterAddress,
    Selector.MarketSelectors.Uniswap,
  ]);

  await execute(
    "CoreRouter",
    { from: privateKey, log: true, gasLimit: 500000 },
    "transferOwnership",
    process.env.OWNER_PUBLIC_KEY,
  );
};
module.exports.tags = ["Core-Router-Optimism"];
