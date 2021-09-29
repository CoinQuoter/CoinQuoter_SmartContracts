import { Injectable } from '@angular/core';
import { ConnectionInfo } from '../../models/connection-info';
import { BaseDataService } from '../base-data/base-data.service';

export interface ExecutionData {
  type: number,
  data: any,
  sellAmount: number,
  buyAmount: number,
  config: ConnectionInfo,
  price: number,
  sellBalance: number,
  buyBalance: number,
  sellToken: string,
  buyToken: string,
  gasPrice: number,
}

@Injectable({
  providedIn: 'root'
})
export class ExecutionDataService extends BaseDataService<ExecutionData>{

  constructor() {
    super();
  }

}
