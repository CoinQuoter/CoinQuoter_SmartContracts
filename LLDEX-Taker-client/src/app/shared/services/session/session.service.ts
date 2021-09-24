import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ProviderService } from '../provider/provider.service';
import { ELocalstorageNames } from '../../enums/localstorage-names.constants';

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
    const LOPContract = new ethers.Contract(lopAddress, ABILOP, this.providerService);
    const signer = this.providerService.getSigner(0);
    const wallet = ethers.Wallet.createRandom();
    const expirationTime = Math.round(date.getTime()/1000);

    const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime);
    await this.providerService.waitForTransaction(result.hash);

    localStorage.setItem(ELocalstorageNames.SESSION_EXPIRE_TIME, date.toString());
    localStorage.setItem(ELocalstorageNames.SESSION_TAKER, JSON.stringify({
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
    return this.getTimeLeft() > 0;
  }

  getTimeLeft() {
    const time = localStorage.getItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
    return new Date(time).getTime() - new Date().getTime()
  }

  getExpirationTimeStamp() {
    return localStorage.getItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
  }

  clearStorage() {
    localStorage.removeItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
    localStorage.removeItem(ELocalstorageNames.SESSION_TAKER);
  }

  getSessionDetails() {
    return JSON.parse(localStorage.getItem(ELocalstorageNames.SESSION_TAKER));
  }
}
