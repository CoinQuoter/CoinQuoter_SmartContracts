import { Component, OnInit } from '@angular/core';
import { TradeDataService } from '../../shared/services/trade-data/trade-data.service';
import { ExecutionDataService } from '../../shared/services/execution-data/execution-data.service';
import { EOperationType } from '../../shared/enums/operation-type.constants';
import { PubnubService } from '../../shared/services/pubnub/pubnub.service';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { PubnubOrdersConfig } from 'app/shared/constants/config.constants';

@Component({
  selector: 'app-transaction-status',
  templateUrl: './transaction-status.component.html',
  styleUrls: ['./transaction-status.component.css']
})
export class TransactionStatusComponent implements OnInit {

  tradeDate: Date;
  base: string;
  quote: string;
  bidPrice: number;
  askPrice: number;
  sellAmount: number;
  buyAmount: number;
  action: string;
  status: string;
  config: ConnectionInfo;
  data: any;
  type: number;
  sellToken: string;
  buyToken: string;
  sellBalance: number;
  buyBalance: number;
  price: number;
  gasPrice: number;
  hash: string;

  constructor(private tradeDataService: TradeDataService,
              private executionDataService: ExecutionDataService,
              private pubnubService: PubnubService,
              private blockchainService: BlockchainService) { }

  ngOnInit(): void {
    this.status = "pending";
    this.hash = '';
    this.tradeDate = new Date();
    const executionData = this.executionDataService.getData();
    const tradeData = this.tradeDataService.getData();
    const orderId = this.generateOrderId();
    this.config = executionData.config;
    this.data = executionData.data;

    const orderStatusConfig = {
      title: orderId.toString(),
      settings: {
        channels: [orderId.toString()],
        withPresence: true,
      }
    }

    const pubnubClient = this.pubnubService.connect(orderStatusConfig, PubnubOrdersConfig);
    
    pubnubClient.addListener({message: async event => {
          const message = event.message.content;
          this.data = event.message.content.data;

          switch (message.type) {
            case "transaction_posted": {
              this.status = "posted";
              this.hash = this.data.hash;
            } break;
            case "transaction_filled": {
              this.status = "confirmed";
              this.hash = this.data.hash;

              pubnubClient.unsubscribe(orderStatusConfig.settings);
            } break;
            case "transaction_failed": {
              this.status = "failed";

              pubnubClient.unsubscribe(orderStatusConfig.settings);
            } break;
            case "transaction_rejected": {
              this.status = "rejected";

              pubnubClient.unsubscribe(orderStatusConfig.settings);
            }
          }
      }});

    [this.base, this.quote] = tradeData.pair.split("/");
    this.sellAmount = executionData.sellAmount;
    this.buyAmount = executionData.buyAmount;
    this.sellToken = executionData.sellToken;
    this.buyToken = executionData.buyToken;
    this.sellBalance = executionData.sellBalance;
    this.buyBalance = executionData.buyBalance;
    this.price = executionData.price;
    this.type = executionData.type;
    this.gasPrice = executionData.gasPrice;

    this.blockchainService.publishMessageToMaker(orderId, this.type, this.data, this.sellAmount, this.buyAmount, this.config);
  }

  generateOrderId(): number {
    const _array = new Uint32Array(1);
    window.crypto.getRandomValues(_array);
    const orderId = _array[0];

    return orderId;
  }
}
