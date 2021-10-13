import { PubNubKeyset } from "../models/pubnub-keyset";

export const PubnubQuoteConfig: PubNubKeyset = {
  subscribeKey: "sub-c-ca71f2ac-282c-11ec-b636-021bdbd01fcd",
}

export const PubnubOrdersConfig: PubNubKeyset = {
  subscribeKey: "sub-c-260a2832-282d-11ec-bfec-fa2d187f6aa6",
  publishKey: "pub-c-1275ee5a-d148-46a0-aac9-2544cb7ca08c"
}

export const PUBNUB_QUOTE_EXECUTION_MARKER = "-quote-executions"
export const FEE_TOKEN_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const FRONTEND_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const LIMITORDERPROTOCOL_ADDRESS = "0xbFE71f56Fd7670BBB2C76A44067d633F1B44F765";
export const FILLORDER_RFQ_ESTIMATED_GAS_USAGE = 139333;

export const SUPPORTED_NETWORKS: number[] = [
  1666600000
]
