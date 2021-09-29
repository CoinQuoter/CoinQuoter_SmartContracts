# LLDEX
Low Latency DEX
This project is done as a Harmony Hackathon project: https://gitcoin.co/hackathon/harmony-defi/projects/9385/low-latency-p2p-dex

Full documentation of the project can be found on: https://lldex.gitbook.io/lldex/

Demo video: .....

# What is LLDEX?

### Low Latency DEX Protocol

Low Latency DEX is a permissionless protocol to settle crypto trades between 2 counterparties \(Wallet2Wallet trading\).

The framework allows counterparties to agree on the price off-chain in a low latency environment and settle the trade on-chain. Thanks to the Last Look workflow market makers have a chance to auto-hedge client flow on other chains \(cross-chain\) or on low latency centralized exchanges. This makes liquidity independent from TVL. 

#### 🤝 General workflow

1. Market Maker is streaming prices to Market Taker
2. Market Taker is sending Execution Request to Market Maker
3. Maker Maker is sending trade to the blockchain for trade settlement

To allow **low latency** execution workflow between 2 parties without compromising security, we implemented an additional key set on the market taker and on the market maker side. Information about keys used for low latency workflows is saved on the blockchain.

#### 🤝 Market Maker

Rates streamed by Market Maker do not commit the Market Maker to execute a particular quote \(this is not firm liquidity\). It is up to the Market Maker to decide if the Execution Request sent by Market Taker should be sent to the blockchain for settlement.

LLDEX workflow is allowing an almost risk-free position to auto-hedging of any incoming execution request on any platform. Auto-hedging can be performed between receiving an Execution Request from Market Taker and sending the transaction to the blockchain for settlement. If the hedge trade would not be possible at the given price, Market Maker can reject the execution request \(last-look\). Market Makers is paying gas for the trade. The cost associated with gas should be included in the price. Price without gas cost can be shown in a separate field on the client screen \(particularly important in the case of small trades on expensive networks like Etherum\).

Market Maker should take care of the latency between the server that is streaming the price and the end client. Market Maker has full control over its reputation. Constant trade rejections will cause reputation damage.

To achieve low latency execution, Market Maker has a special key set \(session account\) stored in the browser or any other software that is responsible for trade confirmation. Session account is pushing trades to the blockchain for settlement, so it should hold money that would cover gas costs.

#### 👨‍🌾 Market Takers

Market Taker is getting current prices from Market Maker. Market Taker is sending the execution request to the Market Maker with validity time. Validity time should be dependent on the finality time of a given blockchain and the maximum value of last look time that the Market Taker would give to a particular Market Maker.

To achieve low latency execution, Market Taker has a session key stored in the browser. Information about the session key is stored on the blockchain. Session key has validity time. The concept is taken from a regular authorization standard used by companies like Amazon, Google, Facebook.

Execution request is a data structure created off-chain \(ex. in the browser\) and signed according to [EIP-712](https://eips.ethereum.org/EIPS/eip-712) by the valid session key.

### Why we built Low Latency DEX Protocol

Most of the Crypto volumes are one on specialized Centralized Regulated Exchanges \(CEX\) like Binance, Hobi, Coinbase, FTX and [others](https://coinmarketcap.com/rankings/exchanges/). This is in contradiction with the main idea behind cryptocurrencies: DECENTRALIZATION.

[Decentralized Exchanges](https://coinmarketcap.com/rankings/exchanges/dex/) \(DEX\) are now trying very hard to change it, but they are still a long way behind CEX. To help bring more Crypto volume that settles directly on-chain, we decided to copy the last-look workflow from OTC market and create LLDEX concept.

We hope that our work will be used by market makers that will be able to offer OTC liquidity that is settled on-chain. The other use of this concept would be multi-market maker platforms that would aggregate, manage and provide tools for market makers as an alternative for providing liquidity on platforms like Uniswap/PancakeSwap/SushiSwap etc.

### Stay Connected

Who we are looking for:

* Market Takers that would be willing to trade using real-time prices from hundreds if not thousands of market makers and settle trades on-chain.
* Market Makers that are holding funds on and off-chain and would be willing to pass liquidity from Centralized Exchanges to on-chain Market Takes with use of newly created tools
* Professional Market Makers that would be willing to work with us on the creation of a dedicated Single Market Maker portal
* DeFI experts that would be willing to spread the concept across the industry

Connect with us on social media to stay up to date:

* [Twitter](https://twitter.com/kamilchels)
* [Discord](https://discord.gg/UjBjFmVa)


