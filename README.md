# LLDEX
Low Latency DEX

This project is done as a Harmony Hacketon project: https://gitcoin.co/hackathon/harmony-defi/projects/9385/low-latency-p2p-dex

90% of trades on the interbank market are done between market makers and market takers that have some sort of relationship with each other. Order Book-style trading is relatively limited because there are very few market participants that know where the real market is in a particular millisecond. Market Makers aggregate feeds from multiple sources and offer prices to the end customers. Thank "last look" Market Makers are able to check if the market price that they quoted has not changed to much. During the last look Market Makers can auto-hedge flow before giving final confirmation to the end customer. Every big market taker has just 5-7 very good market makers (having more would have a negative impact on the price).  Smaller market takers usually just use single bank portals to trade FX. Thanks to this structure bid-ask spread on OTC FX SPOT/FX Forward/FX SWAP is &lt; 0.001% on the most traded pairs.  

With most crypto volume happening on CEX, flow on DEX platform is mostly related to arbitrage. To confirm, you play around with our P&amp;L report of LPs on Uniswap v3: https://dune.xyz/queries/101811 - in most cases LPs would be better off, not providing liquidity to Uniswap v3 and just keep the initial ratio of tokens that they put in because Fees are smaller than loss related to the change in token ratio. From our perspective, long term it makes sense to provide liquidity to DEX only on pairs, where a particular DEX is a primary market for a particular instrument or at least if arbitrage flow is smaller than real client flow. 

Our interbank experience is telling us, that even Harmony finally of 2 sec, if not enough to make on-chain DEX a leading market for most trades crypto pairs. With growing knowledge on the market about the profitability of market-making strategies on AMMs like Uniswap, it might be that liquidity on these platforms will slowly diminish. 

Taking all the above into account there is a need for a new type of blockchain-based trading.

One of the solutions that we see in the long-run, is a split between the low-latency price discovery from the blockchain-based settlement. This would bring back the blockchain role to the one it was initially designed for (a double-spending problem for digital currencies described by Satoshi Nakamoto)

General Solution Architecture: 
- Front-end needs to be run and managed by a particular market maker/aggregator of market makers/DAOs (legal disclamers can be taken from: https://liquity.org/)
- Market maker/price aggregator is streaming a price via WebSocket/WebRTC/https://docs.ethswarm.org/docs/dapps-on-swarm/pss to the end client 
getting pricing from CEXes via Hummingbot aggregation
- End client is confirming the order and sending the execution request to the market maker with a validity time of ... seconds (dependent on average blockchain finality and last look time needed for particular market maker)
- When the market taker is requesting a price, that no longer available, market maker is able to reject the trade
- During last look window, the market maker is able to auto hedge client order via Hummingbot 
- When the trade is confirmed the MARKET MAKER is sending the trade to the blockchain for settlement. 
- Market maker can also fill the trade with a price that is better than what the client has clicked (positive slippage) 
- In most cases, all trades should be profitable for the market maker, but it can sometimes take a small loss to decrease rejection ratio statistics for a given front-end 

The general idea of how to do combine on and off-chain workflow for the above solution can be taken of 1inch limit order protocol. To achieve the smallest possible latency between market taker sending execution requests and market maker sending trade to the blockchain for settlement, there is a need for some additional authorization workflow on both ends. To achive decentralization, front-ends should be run IPFS/ethswarm.org style hosting.

Problems to solve:
- How to do marketing of the project (stage 1: get 1-3 market makers that would have a lot of capital on chain and on CEX, stage 2: get retail customers)
- How to measure the performance of the market maker, if the page is run by market maker
- How front-end should be hosted/managed in the decentralized way
- How to do marketing (maybe market makers can take over???)
- How to enable Wallet2Wallet trading using third party feeds (ex. retail client is streaming pricing directly to other retail client via websocket/WebRTC) -> in particular how to prevent DOS style attacts what would flod the system with low quality quotes/quotes that would be always rejected

Roadmap:
- Stage 1: bring above to the market
- Stage 2: create real-time FX SWAP alternative on crypto and enable 20x leverage for on-chain trades -> decrease capital usage for market makers (they can then work on margin on CEX and DEX) - > every FX SPOT trade can be combined with FX SWAP -> this would give 20x leverage for market makers willing to move liqudity from CEX to DEX

If you would like to join the project, connect with me via discord: kamilchels#5658
