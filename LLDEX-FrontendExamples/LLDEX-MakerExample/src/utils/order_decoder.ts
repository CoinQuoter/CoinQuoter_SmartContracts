import { ethers } from "ethers";
import { ERC20Methods } from "../models/erc20_methods";
import { OrderAssetData } from "../models/order_asset_data";
import { RFQOrderInfo } from "../models/rfq_order_info";
import ERC20ABI from '../abi/ERC20ABI.json';

const _FROM_INDEX: number = 0;
const _TO_INDEX: number = 1;
const _AMOUNT_INDEX: number = 2;
const _ORDER_MASK: bigint = BigInt('0xFFFFFFFFFFFFFFFF');
const _TIMESTAMP_OFFSET: bigint = BigInt(0x40);

export default class OrderDecoder {
    static decodeInfo(info: string): RFQOrderInfo {     
        const expirationTimestamp = (BigInt(info) >> BigInt(_TIMESTAMP_OFFSET)).toString(10);
        const orderId = (BigInt(info) & _ORDER_MASK).toString(10); 

        return {
            expirationTimestamp: expirationTimestamp,
            orderId: orderId,
        }
    }

    static decodeAssetData(assetData: string): OrderAssetData { 
        const erc20Interface = new ethers.utils.Interface(ERC20ABI); 
        
        const decodeResult = erc20Interface.decodeFunctionData(ERC20Methods.transferFrom, assetData);
        const fromAddress = decodeResult[_FROM_INDEX];
        const toAddress = decodeResult[_TO_INDEX];
        const amount = decodeResult[_AMOUNT_INDEX];

        return {
            fromAddress: fromAddress.toString(),
            toAddress: toAddress.toString(),
            amount: amount.toString(),
        }
    }
}