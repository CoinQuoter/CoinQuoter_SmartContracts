import Decimal from "decimal.js"
import { TokenPair } from "../models/token_pair"

export default class Config {
    static limitOrderProtocolABI: string[] = [
        "function fillOrderRFQ(tuple(uint256 info, uint256 feeAmount, address takerAsset, address makerAsset, address feeTokenAddress, address frontendAddress, bytes takerAssetData, bytes makerAssetData), bytes calldata signature, uint256 takingAmount, uint256 makingAmount) external returns(uint256, uint256)",
        "function session(address owner) external view returns(address taker, address sessionKey, uint256 expirationTime, uint256 txCount)",
        "function createOrUpdateSession(address sessionKey, uint256 expirationTime) external returns(int256)",
        "function sessionExpirationTime(address owner) external view returns(uint256 expirationTime)",
        "function endSession() external",
        "event OrderFilledRFQ(bytes32 orderHash, uint256 takingAmount, uint256 makingAmount)",
        "event SessionTerminated(address indexed sender, address indexed sessionKey)",
        "event SessionCreated(address indexed creator, address indexed sessionKey, uint256 expirationTime)",
        "event SessionUpdated(address indexed sender, address indexed sessionKey, uint256 expirationTime)",
    ]

    static pubNubPublishKey: string = "pub-c-d009446b-b9de-41fa-8c2d-b779fd13ba58"
    static pubNubSubscribeKey: string = "sub-c-790990b4-0c8e-11ec-9c1c-9adb7f1f2877"
    static limitOrderProtocolAddress: string = "0x8a791620dd6260079bf849dc5567adc3f2fdc318"
    static fillOrderRFQEstimatedGasUsage: number = 139333
    static signWithPrivateKey: boolean = true;

    static pairs: TokenPair[] = [
    {
        token0: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        token1: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        token0Dec: 18,
        token1Dec: 18,
        slippage: new Decimal("0.0005"),
        spreadBid: new Decimal("0.5"),
        spreadAsk: new Decimal("0.7"),
        maxToken0: new Decimal("10.0"),
        maxToken1: new Decimal("15000.0"),
        mappingBinance: "ethusdt",
        channelName: "eth-usdt-1"
    },
    {
        token0: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        token1: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        token0Dec: 18,
        token1Dec: 18,
        slippage: new Decimal("0.001"),
        spreadBid: new Decimal("0.05"),
        spreadAsk: new Decimal("0.03"),
        maxToken0: new Decimal("135.0"),
        maxToken1: new Decimal("5.0"),
        mappingBinance: "btcusdt",
        channelName: "btc-usdt-1"
    }
]
}
