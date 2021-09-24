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

  constructor(private tradeDataService: TradeDataService,
              private executionDataService: ExecutionDataService,
              private pubnubService: PubnubService,
              private blockchainService: BlockchainService) { }

  ngOnInit(): void {
    this.status = "Pending";
    this.tradeDate = new Date();
    const executionData = this.executionDataService.getData();
    const tradeData = this.tradeDataService.getData();
    this.config = executionData.config;
    this.data = executionData.data;

    this.pubnubService.connect(this.config).addListener({message: async event => {
          const message = event.message.content;
          this.data = event.message.content.data;
          if(message.type == "transaction_posted") this.status = "Posted";
          else if(message.type == "transaction_filled") this.status = "Filled";
          else if(message.type == "transaction_failed") this.status = "Failed";
      }});

    [this.base, this.quote] = tradeData.pair.split("/");
    this.bidPrice = tradeData.bid;
    this.askPrice = tradeData.ask;
    this.sellAmount = executionData.sellAmount;
    this.buyAmount = executionData.buyAmount;
    this.type = tradeData.type;
    this.action = this.type == EOperationType.BID ? "Sell" : "Buy";


    this.blockchainService.publishMessageToMaker(this.type, this.data, this.sellAmount, this.buyAmount, this.config);
  }


}
