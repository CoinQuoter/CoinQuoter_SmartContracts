import { Component, OnInit } from '@angular/core';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { WETH_DAI, WETH_LLDEX } from '../../shared/constants/connections.constants';
@Component({
  selector: 'app-live-rates',
  templateUrl: './live-rates.component.html',
  styleUrls: ['./live-rates.component.css']
})
export class LiveRatesComponent implements OnInit {

  weth_dai: ConnectionInfo;
  weth_lldex: ConnectionInfo;

  constructor() { }

  ngOnInit(): void {
    this.weth_dai = WETH_DAI;
    this.weth_lldex = WETH_LLDEX;
  }

}
