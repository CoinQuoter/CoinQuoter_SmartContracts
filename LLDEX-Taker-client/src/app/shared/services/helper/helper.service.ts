import { Injectable } from '@angular/core';
import { ECurrencyPair } from '../../enums/currency-pair.constants';
import { WETH_DAI, WETH_LLDEX } from '../../constants/connections.constants';
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
      case ECurrencyPair.WETH_DAI: return WETH_DAI;
      case ECurrencyPair.WETH_LLDEX: return WETH_LLDEX;
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
