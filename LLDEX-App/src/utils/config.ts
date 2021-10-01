import Decimal from "decimal.js"
import { TokenPair } from "../models/token_pair"
import PubnubMakerKeyset from '../Maker_Keyset.json'

export default class Config {
    static limitOrderProtocolABI: string[] = [
        "function testSignature(tuple(uint256 info, uint256 feeAmount, address takerAsset, address makerAsset, address feeTokenAddress, address frontendAddress, bytes takerAssetData, bytes makerAssetData), bytes calldata signature) public view returns(bytes32 orderHash, address signer, uint256 chainId)",
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

    /*
        Maker quotes keyset
    */
    static pubNubQuotePublishKey: string = PubnubMakerKeyset.publishKey
    static pubNubQuoteSubscribeKey: string = PubnubMakerKeyset.subscribeKey

    /*
        Order status keyset
    */
    static pubNubOrderPublishKey: string = "pub-c-ff397b4e-99d7-4995-90d1-bd157c6eb6c3"
    static pubNubOrderSubscribeKey: string = "sub-c-c72e4772-21b4-11ec-925a-3eee4c94e219"

    static limitOrderProtocolAddress: string = "0xbFE71f56Fd7670BBB2C76A44067d633F1B44F765"
    static fillOrderRFQEstimatedGasUsage: number = /*139333*/ 0
    static signWithPrivateKey: boolean = true;
    static quoteExecutionsMarker: string = "-quote-executions"
    
    static pairs: TokenPair[] = [
        // Harmony mainnet
        {
            token0: "0xcf664087a5bb0237a0bad6742852ec6c8d69a27a",
            token1: "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f",
            token0Dec: 0,
            token1Dec: 0,
            slippage: new Decimal("0.0005"),
            spreadBid: new Decimal("0.005"),
            spreadAsk: new Decimal("0.004"),
            maxToken0: new Decimal("5.0"),
            maxToken1: new Decimal("0.5"),
            mappingBinance: "oneusdt",
            channelName: "one-usdt-10"
        },
        {
            token0: "0xcf664087a5bb0237a0bad6742852ec6c8d69a27a",
            token1: "0x3095c7557bcb296ccc6e363de01b760ba031f2d9",
            token0Dec: 0,
            token1Dec: 0,
            slippage: new Decimal("0.001"),
            spreadBid: new Decimal("0.000000004"),
            spreadAsk: new Decimal("0.000000008"),
            maxToken0: new Decimal("0.00005"),
            maxToken1: new Decimal("0.00005"),
            mappingBinance: "onebtc",
            channelName: "one-btc-10"
        },
        {
            token0: "0x6983d1e6def3690c4d616b13597a09e6193ea013",
            token1: "0x3095c7557bcb296ccc6e363de01b760ba031f2d9",
            token0Dec: 0,
            token1Dec: 0,
            slippage: new Decimal("0.001"),
            spreadBid: new Decimal("0.00005"),
            spreadAsk: new Decimal("0.00003"),
            maxToken0: new Decimal("0.00005"),
            maxToken1: new Decimal("0.00005"),
            mappingBinance: "ethbtc",
            channelName: "eth-btc-10"
        },
        {
            token0: "0x6983d1e6def3690c4d616b13597a09e6193ea013",
            token1: "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f",
            token0Dec: 0,
            token1Dec: 0,
            slippage: new Decimal("0.001"),
            spreadBid: new Decimal("0.05"),
            spreadAsk: new Decimal("0.03"),
            maxToken0: new Decimal("0.00005"),
            maxToken1: new Decimal("4"),
            mappingBinance: "ethusdt",
            channelName: "eth-usdt-10"
        },
        {
            token0: "0x3095c7557bcb296ccc6e363de01b760ba031f2d9",
            token1: "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f",
            token0Dec: 0,
            token1Dec: 0,
            slippage: new Decimal("0.001"),
            spreadBid: new Decimal("0.05"),
            spreadAsk: new Decimal("0.03"),
            maxToken0: new Decimal("0.00005"),
            maxToken1: new Decimal("4"),
            mappingBinance: "btcusdt",
            channelName: "btc-usdt-10"
        }
    ]
}
