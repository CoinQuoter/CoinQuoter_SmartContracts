import { Component, OnInit } from '@angular/core';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { WETH_DAI } from '../../shared/constants/connections.constants';
@Component({
  selector: 'app-live-rates',
  templateUrl: './live-rates.component.html',
  styleUrls: ['./live-rates.component.css']
})
export class LiveRatesComponent implements OnInit {

  weth_dai: ConnectionInfo;

  constructor() { }

  ngOnInit(): void {
    this.weth_dai = WETH_DAI;
  }

}
