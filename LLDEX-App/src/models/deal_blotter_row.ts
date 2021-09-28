import Decimal from "decimal.js";

export interface DealBlotterRow {
    takerAddress: string;
    orderType: string;
    amountToken0: string;
    amountToken1: string;
    price: string;
}
