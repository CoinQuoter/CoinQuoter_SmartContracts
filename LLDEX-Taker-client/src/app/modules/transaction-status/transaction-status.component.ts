import { Component, OnInit } from '@angular/core';
import { TradeDataService } from '../../shared/services/trade-data/trade-data.service';
import { ExecutionDataService } from '../../shared/services/execution-data/execution-data.service';
import { EOperationType } from '../../shared/enums/operation-type.constants';
import { PubnubService } from '../../shared/services/pubnub/pubnub.service';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';

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
    this.config = executionData.config;
    this.data = executionData.data;

    this.pubnubService.connect(this.config).addListener({message: async event => {
          const message = event.message.content;
          this.data = event.message.content.data;

          if(message.type == "transaction_posted") this.status = "posted";
          else if(message.type == "transaction_filled") {
            this.status = "confirmed";
            this.hash = this.data.hash;
          }
          else if(message.type == "transaction_failed") this.status = "failed";
          else if(message.type == "transaction_rejected") this.status = "rejected";
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

    this.blockchainService.publishMessageToMaker(this.type, this.data, this.sellAmount, this.buyAmount, this.config);
  }


}
