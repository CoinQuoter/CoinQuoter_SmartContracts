import { PubNubKeyset } from "../models/pubnub-keyset";

export const PubnubQuoteConfig: PubNubKeyset = {
  subscribeKey: "sub-c-4e55a09a-22a7-11ec-880d-a65b09ab59bc",
}

export const PubnubOrdersConfig: PubNubKeyset = {
  subscribeKey: "sub-c-c72e4772-21b4-11ec-925a-3eee4c94e219",
  publishKey: "pub-c-ff397b4e-99d7-4995-90d1-bd157c6eb6c3"
}

export const PUBNUB_QUOTE_EXECUTION_MARKER = "-quote-executions"
export const FEE_TOKEN_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const FRONTEND_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const LIMITORDERPROTOCOL_ADDRESS = "0xbFE71f56Fd7670BBB2C76A44067d633F1B44F765";
export const FILLORDER_RFQ_ESTIMATED_GAS_USAGE = 139333;

export const SUPPORTED_NETWORKS: number[] = [
  1666600000
]
