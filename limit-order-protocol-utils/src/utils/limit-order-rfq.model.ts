export interface CreatingParams {
    chainId: number;
    privateKey: string;
    orderId: number;
    expiresIn: number;
    feeAmount: string;
    takerAssetAddress: string;
    makerAssetAddress: string;
    takerAmount: string;
    makerAmount: string;
    makerAddress: string;
    feeTokenAddress: string;
    frontendAddress: string;
}

export interface FillingParams {
    chainId: number;
    privateKey: string;
    gasPrice: number;
    order: string;
    takerAmount: string;
    makerAmount: string;
}

export interface CancelingParams {
    chainId: number;
    privateKey: string;
    gasPrice: number;
    orderInfo: string;
}

export interface OperationParams {
    operation: string;
}
