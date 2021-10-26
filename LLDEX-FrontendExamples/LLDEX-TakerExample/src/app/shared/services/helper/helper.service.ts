import { Injectable } from '@angular/core';
import { ECurrencyPair } from '../../enums/currency-pair.constants';
import { BTC_USDT, ETH_BTC, ETH_USDT, ONE_BTC, ONE_USDT} from '../../constants/connections.constants';
import { ConnectionInfo } from '../../models/connection-info';
import { BigNumber } from 'ethers';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  accuracy: number;

  constructor() { }

  getConnectionInfo(selectedPair: string): ConnectionInfo {
    switch (selectedPair){
      //case ECurrencyPair.WETH_DAI: return WETH_DAI;
      // case ECurrencyPair.WETH_LLDEX: return WETH_LLDEX;
      case ECurrencyPair.ONE_USDT: return ONE_USDT
      case ECurrencyPair.ONE_BTC: return ONE_BTC
      case ECurrencyPair.ETH_BTC: return ETH_BTC
      case ECurrencyPair.BTC_USDT: return BTC_USDT
      case ECurrencyPair.ETH_USDT: return ETH_USDT
    }
  }

  pairToParam(pair: string): string {
    return pair.replace("/", "_").toLowerCase();
  }

  paramToPair(param: string): string {
    return param.replace("_", "/").toUpperCase();
  }

  setAccuracy(value: number) {
    this.accuracy = value;
  }

  toNumber(value: BigNumber): number{
    const acc = this.accuracy ?? 0;
    return Number(value)/Math.pow(10, acc)
  }
}
