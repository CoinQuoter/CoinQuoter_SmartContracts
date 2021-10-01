import { Inject, Injectable } from '@angular/core';
import { ProviderService, WEB3PROVIDER } from '../provider/provider.service';
import { ethers } from 'ethers';
import { EOperationType } from '../../enums/operation-type.constants';
import { SessionService } from '../session/session.service';
import Web3 from 'web3';
import { LimitOrderBuilder, PrivateKeyProviderConnector } from '../../../../../../limit-order-protocol-utils/dist';
import { ConnectionInfo } from '../../models/connection-info';
import { PubnubService } from '../pubnub/pubnub.service';
import { FEE_TOKEN_ADDRESS, FRONTEND_ADDRESS, LIMITORDERPROTOCOL_ADDRESS, PUBNUB_QUOTE_EXECUTION_MARKER } from '../../constants/config.constants';
import Decimal from 'decimal.js';

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

  isExtensionInstalled(): boolean {
    return !!this.web3Provide;
  }

  isLogged(): boolean {
    return this.isExtensionInstalled() && !!this.web3Provide._state.accounts && this.web3Provide._state.accounts.length > 0;
  }

  requestAccount() {
    return this.web3Provide.request({method: 'eth_requestAccounts'});
  }

  async getSignerAddress() {
    return await this.providerService.getSigner(0).getAddress();
  }

  async updateAllowance(data: any, type: number, allowance: number){
    const address = type == EOperationType.BID ? data.amount0Address : data.amount1Address;
    const decimals = type == EOperationType.BID ? data.amount0Dec : data.amount1Dec;
    const tokenContract = new ethers.Contract(address, ABIERC20, this.providerService);

    const newAllowance = Number(allowance * Math.pow(10, decimals));
    const result = await tokenContract.connect(this.providerService.getSigner(0)).approve(data.contractAddress, newAllowance.toLocaleString('fullwide', {useGrouping:false}));
    await this.providerService.waitForTransaction(result.hash);
  }

  getERC20Contract(address: string) {
    return new ethers.Contract(address, ABIERC20, this.providerService)
  }

  async getTokenBalance(contract: ethers.Contract) {
    return contract.connect(await this.getSignerAddress()).balanceOf(this.getSignerAddress());
  }

  async getAllowanceAmount(contract: ethers.Contract, limitOrderProtocolAddress: string) {
    return contract.connect(await this.getSignerAddress()).allowance(this.getSignerAddress(), limitOrderProtocolAddress)
  }

  getBalance() {
    return this.providerService.getBalance(this.getSignerAddress());
  }

  async getChainId(): Promise<number> {
    const chainId = (await this.providerService.getNetwork()).chainId

    switch (chainId) {
      case 1666600000: return 1;
      case 1666700000: return 2;
      default: return chainId;
    }
  }

  async sign1InchOrder(orderId: number, type: EOperationType, data: any, amountInput: number, amountOutput: number) {
    const session = this.sessionService.getSessionDetails();
    const sessionPrivateKey = session.session_private_key.replace("0x", "");

    const web3 = new Web3(window.ethereum);
    const walletAddress = await this.providerService.getSigner(0).getAddress();
    const providerConnector = new PrivateKeyProviderConnector(sessionPrivateKey, web3);
    let limitOrderBuilder = new LimitOrderBuilder(
      LIMITORDERPROTOCOL_ADDRESS,
      await this.getChainId(),
      providerConnector);

      
    let amountIn = new Decimal(amountInput).mul(new Decimal(10).pow(type == EOperationType.BID ? data.amount0Dec : data.amount1Dec)).toFixed(0);
    let amountOut = new Decimal(amountOutput).mul(new Decimal(10).pow(type == EOperationType.BID ? data.amount1Dec : data.amount0Dec)).toFixed(0);

    const [takerAssetAddress, makerAssetAddress] =
      (type == EOperationType.ASK)
        ? [data.amount1Address, data.amount0Address]
        : [data.amount0Address, data.amount1Address]

    const limitOrder = limitOrderBuilder.buildRFQOrder({
      id: orderId,
      expiresInTimestamp: Math.round(new Date().getTime() / 1000) + 1800,
      takerAssetAddress: takerAssetAddress,
      makerAssetAddress: makerAssetAddress,
      takerAddress: walletAddress,
      makerAddress: data.makerAddress,
      takerAmount: amountIn,
      makerAmount: amountOut,
      feeTokenAddress: FEE_TOKEN_ADDRESS,
      feeAmount: "0",
      frontendAddress: FRONTEND_ADDRESS
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

  async publishMessageToMaker(orderId: number,
                              type: EOperationType,
                              data: any,
                              amountInput: number,
                              amountOutput: number,
                              config: ConnectionInfo) {
    const oneInchOrder = await this.sign1InchOrder(orderId, type, data, amountInput, amountOutput);
    const uuid = this.pubnubService.getUUID();
    const channelName = config.settings.channels[0] + PUBNUB_QUOTE_EXECUTION_MARKER;

    this.pubnubService.publishData(config, {
      channel: channelName,
      message: {
        content: {
          type: "action",
          method: "execute_order",
          data: {
            type: Number(type),
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
