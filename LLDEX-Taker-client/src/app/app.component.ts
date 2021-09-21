import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItem } from "primeng/api";
import { BlockchainService } from './shared/services/blockchain/blockchain.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {

  constructor(private blockchainService: BlockchainService) {
  }

  ngOnInit() {
  }
}
