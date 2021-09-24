import { Inject, Injectable } from '@angular/core';
import { ProviderService, WEB3PROVIDER } from '../provider/provider.service';
import { ethers } from 'ethers';
import { EOperationType } from '../../enums/operation-type.constants';
import { SessionService } from '../session/session.service';
import Web3 from 'web3';
import { LimitOrderBuilder, PrivateKeyProviderConnector } from '../../../../../../limit-order-protocol-utils/dist';
import { ConnectionInfo } from '../../models/connection-info';
import { PubnubService } from '../pubnub/pubnub.service';

const ABIERC20: string[] = [
  "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
  "function approve(address _spender, uint256 _value) public returns (bool success)",
  "function balanceOf(address) view returns (uint)"
];

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {

  constructor(@Inject(WEB3PROVIDER) private web3Provide,
              private providerService: ProviderService,
              private sessionService: SessionService,
              private pubnubService: PubnubService) {
  }

  isLogged(): boolean {
    return !!this.web3Provide._state.accounts[0];
  }

  requestAccount() {
    return this.web3Provide.request({method: 'eth_requestAccounts'});
  }

  getSignerAddress() {
    return this.web3Provide._state.accounts[0];
  }

  async updateAllowance(data: any, type: number, allowance: number){
    const address = type == EOperationType.BID ? data.amount0Address : data.amount1Address;
    const decimals = type == EOperationType.BID ? data.amount0Dec : data.amount1Dec;
    const tokenContract = new ethers.Contract(address, ABIERC20, this.providerService);

    const newAllowance = Number(allowance * Math.pow(10, decimals));
    await tokenContract.connect(this.providerService.getSigner(0)).approve(data.contractAddress, newAllowance.toLocaleString('fullwide', {useGrouping:false}));
  }

  getERC20Contract(address: string) {
    return new ethers.Contract(address, ABIERC20, this.providerService)
  }

  getTokenBalance(contract: ethers.Contract) {
    return contract.connect(this.getSignerAddress()).balanceOf(this.getSignerAddress());
  }

  getAllowanceAmount(contract: ethers.Contract, limitOrderProtocolAddress: string) {
    return contract.connect(this.getSignerAddress()).allowance(this.getSignerAddress(), limitOrderProtocolAddress)
  }

  getBalance() {
    return this.providerService.getBalance(this.getSignerAddress());
  }

  async sign1InchOrder(type: EOperationType, data: any, amountInput: number, amountOutput: number) {
    const session = this.sessionService.getSessionDetails();
    const sessionPrivateKey = session.session_private_key.replace("0x", "");

    const web3 = new Web3(window.ethereum);
    const walletAddress = await this.providerService.getSigner(0).getAddress();
    const providerConnector = new PrivateKeyProviderConnector(sessionPrivateKey, web3);
    let limitOrderBuilder = new LimitOrderBuilder(data.contractAddress, 31337, providerConnector);

    let amountIn = (amountInput * Math.pow(10, data.amount0Dec)).toLocaleString('fullwide', {useGrouping:false});
    let amountOut = (amountOutput * Math.pow(10, data.amount1Dec)).toLocaleString('fullwide', {useGrouping:false});
    const [takerAssetAddress, makerAssetAddress] =
      (type == EOperationType.ASK)
        ? [data.amount1Address, data.amount0Address]
        : [data.amount0Address, data.amount1Address]

    let array = new Uint32Array(1);
    window.crypto.getRandomValues(array);


    const limitOrder = limitOrderBuilder.buildRFQOrder({
      id: array[0],
      expiresInTimestamp: Math.round(new Date().getTime() / 1000) + 1800,
      takerAssetAddress: takerAssetAddress,
      makerAssetAddress: makerAssetAddress,
      takerAddress: walletAddress,
      makerAddress: data.makerAddress,
      takerAmount: amountIn,
      makerAmount: amountOut,
      feeTokenAddress: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      feeAmount: "0",
      frontendAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    })

    const resultEIP712 = limitOrderBuilder.buildRFQOrderTypedData(limitOrder);
    const limitOrderSignature = await limitOrderBuilder.buildOrderSignature(
      session.session_public_key,
      resultEIP712
    )
    return {
      takerAmount: amountIn,
      makerAmount: amountOut,
      limitOrderSignature: limitOrderSignature,
      limitOrder: limitOrder,
      sessionKey: session.session_public_key
    }
  }

  async publishMessageToMaker(type: EOperationType,
                              data: any,
                              amountInput: number,
                              amountOutput: number,
                              config: ConnectionInfo) {
    const oneInchOrder = await this.sign1InchOrder(type, data, amountInput, amountOutput);
    const uuid = this.pubnubService.getUUID();
    this.pubnubService.publishData(config,{
      channel: config.settings.channels[0],
      message: {
        content: {
          type: "action",
          method: "bid_execute",
          data: {
            type: Number(type),
            price: "",
            takerAmount: oneInchOrder.takerAmount,
            makerAmount: oneInchOrder.makerAmount,
            limitOrderSignature: oneInchOrder.limitOrderSignature,
            limitOrder: oneInchOrder.limitOrder,
            sessionKey: oneInchOrder.sessionKey,
          }
        },
        sender: uuid
      }
    })


  }

}
