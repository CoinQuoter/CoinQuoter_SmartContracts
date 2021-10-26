import { RFQOrder } from "limit-order-protocol-lldex";
import { OrderType } from "./order_type";

export interface SignedLimitOrder {
    type: OrderType,
    takerAmount: string,
    makerAmount: string,
    limitOrderSignature: string,
    limitOrder: RFQOrder,
    sessionKey: string,
}
