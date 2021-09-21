import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ProviderService } from '../provider.service';

const lopAddress = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
const ABILOP: string[] = [
  "function session(address owner) external view returns(address taker, address sessionKey, uint256 expirationTime, uint256 txCount)",
  "function createOrUpdateSession(address sessionKey, uint256 expirationTime) external returns(int256)",
  "function sessionExpirationTime(address owner) external view returns(uint256 expirationTime)",
  "function endSession() external",
  "event OrderFilledRFQ(bytes32 orderHash, uint256 takingAmount)",
  "event SessionTerminated(address indexed sender, address indexed sessionKey)",
  "event SessionCreated(address indexed creator, address indexed sessionKey, uint256 expirationTime)",
  "event SessionUpdated(address indexed sender, address indexed sessionKey, uint256 expirationTime)",
];

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  sessionTimeLeft: string;

  constructor(private providerService: ProviderService,) { }


  async createSession(date: Date) {
    localStorage.setItem('isSession', date.toString());
    const LOPContract = new ethers.Contract(lopAddress, ABILOP, this.providerService);
    const signer = this.providerService.getSigner(0);
    const wallet = ethers.Wallet.createRandom();
    const expirationTime = Math.round(date.getTime()/1000);
    console.log(expirationTime)

    const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime);
    await this.providerService.waitForTransaction(result.hash);

    localStorage.setItem('session-taker', JSON.stringify({
      session_private_key: wallet.privateKey,
      session_public_key: wallet.address,
      session_creator: await signer.getAddress()
    }))
  }

  async endSession() {
    const LOPContract = new ethers.Contract(lopAddress, ABILOP, this.providerService);
    const signer = this.providerService.getSigner(0);

    const result = await LOPContract.connect(signer).endSession();
    await this.providerService.waitForTransaction(result.hash);

    localStorage.clear();
  }

  isSession() {
    if(this.getTimeLeft() < 0) {
      localStorage.removeItem('isSession');
      return false;
    }
    return true;
  }

  getTimeLeft() {
    return new Date(localStorage.getItem('isSession')).getTime() - new Date().getTime()
  }

  getExpirationTimeStamp() {
    return localStorage.getItem('isSession');
  }

  clearStorage() {
    localStorage.clear();
  }

  getSessionDetails() {
    return JSON.parse(localStorage.getItem('session-taker'));
  }
}
