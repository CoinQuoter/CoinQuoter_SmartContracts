import { PubNubKeyset } from "../models/pubnub-keyset";

export const PubnubQuoteConfig: PubNubKeyset = {
  subscribeKey: "sub-c-548dbe6c-3589-11ec-8182-fea14ba1eb2b",
}

export const PubnubOrdersConfig: PubNubKeyset = {
  subscribeKey: "sub-c-46ded6fc-3589-11ec-b886-526a8555c638",
  publishKey: "pub-c-07968a26-b20d-4c1c-8722-17a44044c67f"
}

export const PUBNUB_QUOTE_EXECUTION_MARKER = "-quote-executions"
export const FEE_TOKEN_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const FRONTEND_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const LIMITORDERPROTOCOL_ADDRESS = "0xDD9210351Dbd8c8dB47dCe39E29663164B1BE34D";
export const FILLORDER_RFQ_ESTIMATED_GAS_USAGE = 139333;

export const SUPPORTED_NETWORKS: number[] = [
  1666600000,
  80001
]
