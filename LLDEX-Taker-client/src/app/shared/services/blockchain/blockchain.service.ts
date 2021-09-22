import { Inject, Injectable } from '@angular/core';
import { ProviderService, WEB3PROVIDER } from '../provider.service';
import { ethers } from 'ethers';

const ABIERC20: string[] = [
  "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
  "function approve(address _spender, uint256 _value) public returns (bool success)",
  "function balanceOf(address) view returns (uint)"
];

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {

  constructor(@Inject(WEB3PROVIDER) private web3Provide,
              private providerService: ProviderService) {
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

  async updateAllowance(data: any, type: string, allowance: number){
    const address = type === "sell" ? data.amount0Address : data.amount1Address;
    const decimals = type === "sell" ? data.amount0Dec : data.amount1Dec;
    const tokenContract = new ethers.Contract(address, ABIERC20, this.providerService);

    const newAllowance = allowance * Math.pow(10, decimals);
    console.log(data);
    console.log(await tokenContract.connect(this.providerService.getSigner(0)).approve(data.contractAddress, newAllowance.toFixed()));
  }

}
