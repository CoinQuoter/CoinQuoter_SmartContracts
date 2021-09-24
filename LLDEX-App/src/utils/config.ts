import Decimal from "decimal.js";
import { TokenPair } from "../models/token_pair";

export default class Config {
    static limitOrderProtocolABI: string[] = [
        "function fillOrderRFQ(tuple(uint256 info, uint256 feeAmount, address takerAsset, address makerAsset, address feeTokenAddress, address frontendAddress, bytes takerAssetData, bytes makerAssetData), bytes calldata signature, uint256 takingAmount, uint256 makingAmount) external returns(uint256, uint256)",
        "function session(address owner) external view returns(address taker, address sessionKey, uint256 expirationTime, uint256 txCount)",
        "function createOrUpdateSession(address sessionKey, uint256 expirationTime) external returns(int256)",
        "function sessionExpirationTime(address owner) external view returns(uint256 expirationTime)",
        "function endSession() external",
    ];

    static limitOrderProtocolAddress: string = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
    static defaultPair: number = 0;
    static pairs: TokenPair[] = [{
        token0: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
        token1: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
        token0Dec: 18,
        token1Dec: 18,
        slippage: new Decimal("0.0005"),
        spread: new Decimal("0.5"),
        maxToken0: new Decimal("10.0"),
        maxToken1: new Decimal("45000.0"),
    }];
}
