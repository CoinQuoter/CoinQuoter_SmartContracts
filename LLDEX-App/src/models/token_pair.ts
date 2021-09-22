import Decimal from "decimal.js";

export interface TokenPair {
    token0: string;
    token1: string;
    token0Dec: number;
    token1Dec: number;
    slippage: Decimal;
    spread: Decimal;
    maxToken0: Decimal;
    maxToken1: Decimal;
}
