import { RFQOrder } from "limit-order-protocol-lldex";
import { TokenPair } from "./token_pair";

export interface PostedTransaction {
    pair: TokenPair;
    order: RFQOrder;
}
