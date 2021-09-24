import Decimal from "decimal.js";

export interface TakerTokenPair {
    makerAddress: string;
    channelName: string;
    token0Address: string;
    token1Address: string;
    token0Symbol: string;
    token1Symbol: string;
    token0Dec: number;
    token1Dec: number;
    bid: Decimal;
    ask: Decimal;
    maxToken0: Decimal;
    maxToken1: Decimal;
    lastUpdateId: string;
}
