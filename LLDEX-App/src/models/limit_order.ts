import Decimal from "decimal.js";

export interface LimitOrder {
        lastUpdateId: any,
        bid: Decimal,
        ask: Decimal,
        bidAmount: string,
        askAmount: string,
        makerAddress: string,
        amount0Address: string,
        amount1Address: string,
        amount0Dec: number,
        amount1Dec: number,
        maxToken0: Decimal,
        maxToken1: Decimal,
        contractAddress: string
}
