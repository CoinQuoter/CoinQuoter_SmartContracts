import Decimal from "decimal.js";

export interface TokenPair {
    mappingBinance: string;
    channelName: string;
    token0: string;
    token1: string;
    token0Dec: number;
    token1Dec: number;
    slippage: Decimal;
    spreadBid: Decimal;
    spreadAsk: Decimal;
    maxToken0: Decimal;
    maxToken1: Decimal;
}
