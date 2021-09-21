import { Injectable } from '@angular/core';
import { ECurrencyPair } from '../../enums/currency-pair.constants';
import { WETH_DAI } from '../../constants/connections.constants';
import { ConnectionInfo } from '../../models/connection-info';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  getConnectionInfo(selectedPair: string): ConnectionInfo {
    switch (selectedPair){
      case ECurrencyPair.WETH_DAI: return WETH_DAI;
    }
  }

  pairToParam(pair: string): string {
    return pair.replace("/", "_").toLowerCase();
  }

  paramToPair(param: string): string {
    return param.replace("_", "/").toUpperCase();
  }
}
