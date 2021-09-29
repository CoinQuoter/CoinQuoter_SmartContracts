import { Injectable } from '@angular/core';
import { BaseDataService } from '../base-data/base-data.service';

export interface TradeData {
  pair: string;
  type: number;
  amount: number;
  ask: number;
  bid: number;
  gasPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class TradeDataService extends BaseDataService<TradeData>{

  constructor() {
    super();
  }

}
