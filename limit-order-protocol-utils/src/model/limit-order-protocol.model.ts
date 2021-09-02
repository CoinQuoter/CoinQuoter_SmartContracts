import { EIP712Object } from './eip712.model';
import { LimitOrderPredicateCallData } from '../limit-order-predicate.builder';

export enum ChainId {
    etherumMainnet = 1,
    binanceMainnet = 56,
    polygonMainnet = 137,
}

export type LimitOrderSignature = string;

export type LimitOrderHash = string;

// RFQOrderData.expiresInTimestamp | RFQOrderData.id
export type RFQOrderInfo = string;

export interface LimitOrderData {
    takerAddress: string;
    makerAddress?: string; // Optional, by default = ZERO_ADDRESS
    takerAssetAddress: string;
    makerAssetAddress: string;
    takerAmount: string;
    makerAmount: string;
    predicate?: LimitOrderPredicateCallData;
    permit?: string;
    interaction?: string;
}

export interface RFQOrderData {
    // Index number of RFQ limit order. Example: 1
    id: number;
    // Timestamp when the RFQ limit order will expire (seconds). Example: 1623166102
    expiresInTimestamp: number;
    takerAssetAddress: string;
    makerAssetAddress: string;
    takerAmount: string;
    makerAmount: string;
    takerAddress: string;
    makerAddress?: string; // Optional, by default = ZERO_ADDRESS
}

export interface LimitOrder extends EIP712Object {
    salt: string;
    takerAsset: string;
    makerAsset: string;
    takerAssetData: string;
    makerAssetData: string;
    getTakerAmount: string;
    getMakerAmount: string;
    predicate: string;
    permit: string;
    interaction: string;
}

export interface RFQOrder extends EIP712Object {
    info: RFQOrderInfo;
    takerAsset: string;
    makerAsset: string;
    takerAssetData: string;
    makerAssetData: string;
}

export enum LimitOrderProtocolMethods {
    getTakerAmount = 'getTakerAmount',
    getMakerAmount = 'getMakerAmount',
    fillOrder = 'fillOrder',
    fillOrderRFQ = 'fillOrderRFQ',
    cancelOrder = 'cancelOrder',
    cancelOrderRFQ = 'cancelOrderRFQ',
    nonce = 'nonce',
    advanceNonce = 'advanceNonce',
    increaseNonce = 'increaseNonce',
    and = 'and',
    or = 'or',
    eq = 'eq',
    lt = 'lt',
    gt = 'gt',
    timestampBelow = 'timestampBelow',
    nonceEquals = 'nonceEquals',
    remaining = 'remaining',
    transferFrom = 'transferFrom',
    checkPredicate = 'checkPredicate',
    remainingsRaw = 'remainingsRaw',
    simulateCalls = 'simulateCalls',
    DOMAIN_SEPARATOR = 'DOMAIN_SEPARATOR',
}
