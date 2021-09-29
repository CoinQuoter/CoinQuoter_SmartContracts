import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ProviderService } from '../provider/provider.service';
import { ELocalstorageNames } from '../../enums/localstorage-names.constants';
import { LIMITORDERPROTOCOL_ADDRESS } from '../../constants/config.constants';

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

  session: boolean;

  constructor(private providerService: ProviderService,) {
  }


  async createSession(date: Date) {
    const LOPContract = new ethers.Contract(LIMITORDERPROTOCOL_ADDRESS, ABILOP, this.providerService);
    const signer = this.providerService.getSigner(0);
    const wallet = ethers.Wallet.createRandom();
    const expirationTime = Math.round(date.getTime()/1000);

    const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime);
    await this.providerService.waitForTransaction(result.hash);

    // localStorage.setItem(ELocalstorageNames.SESSION_EXPIRE_TIME, date.toString());
    localStorage.setItem(ELocalstorageNames.SESSION_TAKER, JSON.stringify({
      session_private_key: wallet.privateKey,
      session_public_key: wallet.address,
      session_creator: await signer.getAddress()
    }))
  }

  async endSession() {
    const LOPContract = new ethers.Contract(LIMITORDERPROTOCOL_ADDRESS, ABILOP, this.providerService);
    const signer = this.providerService.getSigner(0);

    const result = await LOPContract.connect(signer).endSession();
    await this.providerService.waitForTransaction(result.hash);

    localStorage.clear();
  }

  isSession() {
    // console.log(this.session);
    // if(typeof this.session === 'undefined'){
    //
    // }
    // const LOPContract = this.getLOPContract();
    // const signer = this.providerService.getSigner(0);
    // signer.getAddress().then((address) => {
    //   LOPContract.connect(signer).sessionExpirationTime(address).then((expirationTime) => {
    //     const expirationDate = new Date(Number(expirationTime.toString()) * 1000);
    //     const dateNow = new Date().getTime() / 1000;
    //     if (expirationTime > dateNow) {
    //       session = true;
    //     }
    //   })
    // });
    return this.session;
  }

  getTimeLeft() {
    const time = localStorage.getItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
    return new Date(time).getTime() - new Date().getTime()
  }

  // getExpirationTimeStamp() {
  //   return localStorage.getItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
  // }

  clearStorage() {
    localStorage.removeItem(ELocalstorageNames.SESSION_EXPIRE_TIME);
    localStorage.removeItem(ELocalstorageNames.SESSION_TAKER);
  }

  getSessionDetails() {
    return JSON.parse(localStorage.getItem(ELocalstorageNames.SESSION_TAKER));
  }

  getLOPContract() {
    return new ethers.Contract(LIMITORDERPROTOCOL_ADDRESS, ABILOP, this.providerService);
  }

  setIsSession(val: boolean) {
    this.session = val;
  }
}
