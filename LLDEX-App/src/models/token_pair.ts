import Decimal from "decimal.js";

export interface _TokenPair {
    mappingBinance: string;
    channelName: string;
    token0: string;
    token1: string;
    slippage: Decimal;
    spreadBid: Decimal;
    spreadAsk: Decimal;
    maxToken0: Decimal;
    maxToken1: Decimal;
}

export interface TokenPair extends Partial<_TokenPair> {
    token0Dec?: number;
    token1Dec?: number;
}
