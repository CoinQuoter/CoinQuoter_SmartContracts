import { Component, OnInit } from '@angular/core';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { BTC_USDT, ETH_BTC, ETH_USDT, ONE_BTC, ONE_USDT } from '../../shared/constants/connections.constants';
@Component({
  selector: 'app-live-rates',
  templateUrl: './live-rates.component.html',
  styleUrls: ['./live-rates.component.css']
})
export class LiveRatesComponent implements OnInit {

  // weth_dai: ConnectionInfo;
  // weth_lldex: ConnectionInfo;
  one_usdt: ConnectionInfo
  one_btc: ConnectionInfo
  eth_btc: ConnectionInfo
  eth_usdt: ConnectionInfo
  btc_usdt: ConnectionInfo

  constructor() { }

  ngOnInit(): void {
    this.one_usdt = ONE_USDT
    this.one_btc = ONE_BTC
    this.eth_btc = ETH_BTC
    this.eth_usdt = ETH_USDT
    this.btc_usdt = BTC_USDT

    // this.weth_dai = WETH_DAI;
    // this.weth_lldex = WETH_LLDEX;
  }

}
