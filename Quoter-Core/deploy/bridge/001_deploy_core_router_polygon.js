require("dotenv").config();
const Selector = require("./000_helper_selector");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;

  const uniswapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const sushiswapRouterAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
  const dfxFinanceRouterAddress = "0x39F45038D763dd88791cE9BdE8d6c18081c7d522";
  const zeroExProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";

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

  // Dfx finance
  await execute("CoreRouter", { from: privateKey, log: true, gasLimit: 500000 }, "addMarket", [
    dfxFinanceRouterAddress,
    Selector.MarketSelectors.DfxFinance,
  ]);

  // Uniswap
  await execute("CoreRouter", { from: privateKey, log: true, gasLimit: 500000 }, "addMarket", [
    uniswapRouterAddress,
    Selector.MarketSelectors.Uniswap,
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
module.exports.tags = ["Core-Router-Polygon"];
