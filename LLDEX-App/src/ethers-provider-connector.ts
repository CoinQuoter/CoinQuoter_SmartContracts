// import { ProviderConnector } from '@1inch/limit-order-protocol/connector/provider.connector';
// import { EIP712TypedData } from '@1inch/limit-order-protocol/model/eip712.model';
// import { ethers } from "ethers"

import { AbiItem, EIP712TypedData, ProviderConnector } from "@1inch/limit-order-protocol";


export class MyProviderConnector implements ProviderConnector {
    contractEncodeABI(abi: AbiItem[], address: string, methodName: string, methodParams: unknown[]): string {
        throw new Error("Method not implemented.");
    }
    signTypedData(walletAddress: string, typedData: EIP712TypedData, typedDataHash: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    ethCall(contractAddress: string, callData: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    decodeABIParameter<T>(type: string, hex: string): T {
        throw new Error("Method not implemented.");
    }

}

// class EthersPrivateKeyProviderConnector implements ProviderConnector {
//     constructor(protected readonly web3Provider: ethers.Wallet) { }

//     contractEncodeABI(
//         abi: any,
//         address: string | null,
//         methodName: string,
//         methodParams: unknown[]
//     ): string {
//         const contract = new ethers.Contract(
//             address === null ? undefined : address,
//             abi
//         );

//         return contract.methods[methodName](...methodParams).encodeABI();
//     }

//     signTypedData(
//         walletAddress: string,
//         typedData: EIP712TypedData,
//         /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
//         _typedDataHash: string
//     ): Promise<string> {
//         if (!this.web3Provider) {
//             throw new Error('Web3 currentProvider is null');
//         }

//         return this.web3Provider.signTransaction('eth_signTypedData_v4', [
//             walletAddress,
//             JSON.stringify(typedData),
//         ]) as Promise<string>;
//     }

//     ethCall(contractAddress: string, callData: string): Promise<string> {
//         return this.web3Provider.call({
//             to: contractAddress,
//             data: callData,
//         }) as Promise<string>;
//     }

//     decodeABIParameter<T>(type: string, hex: string): T {
//         return null as T;
//     }
// }