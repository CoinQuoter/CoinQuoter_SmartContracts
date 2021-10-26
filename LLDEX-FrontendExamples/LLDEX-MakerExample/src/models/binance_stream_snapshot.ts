import Decimal from "decimal.js";

export interface BinanceStreamSnapshot {
    bidInbound: Decimal;
    askInbound: Decimal;
    bidOutbound: Decimal;
    askOutbound: Decimal;
    lastUpdateId: String;
}
