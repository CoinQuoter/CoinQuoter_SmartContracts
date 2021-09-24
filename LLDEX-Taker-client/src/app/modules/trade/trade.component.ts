import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { HelperService } from '../../shared/services/helper/helper.service';
import { EOperationType } from '../../shared/enums/operation-type.constants';
import { PubnubService } from '../../shared/services/pubnub/pubnub.service';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { ProviderService, WEB3PROVIDER } from '../../shared/services/provider/provider.service';
import { TradeData, TradeDataService } from '../../shared/services/trade-data/trade-data.service';
import { ExecutionDataService } from '../../shared/services/execution-data/execution-data.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit {

  connectionInfo: ConnectionInfo;
  tradeData: TradeData;
  sellAmount: number;
  buyAmount: number;
  baseBalance: number;
  quoteBalance: number;
  operation: number;
  bid: number;
  ask: number;
  data: any;

  base: string;
  quote: string;
  sellToken: string;
  buyToken: string;
  pair: string;


  constructor(private router: Router,
              @Inject(WEB3PROVIDER) private web3Provider,
              private helperService: HelperService,
              private route: ActivatedRoute,
              private liveRateService: PubnubService,
              private providerService: ProviderService,
              private blockchainService: BlockchainService,
              private tradeDataService: TradeDataService,
              private executionDataService: ExecutionDataService) { }

  ngOnInit(): void {
    this.initVariables();
    this.retrieveTradeData();

    [this.base, this.quote] = this.connectionInfo.title.split("/");

    [this.sellToken, this.buyToken] = this.isOperationAsk() ? [this.quote, this.base] : [this.base, this.quote];

    this.liveRateService.connect(this.connectionInfo).addListener({ message: async event => {
      if(event.message.content.type == "stream_depth") {
        this.data = event.message.content.data;

        const baseTokenContract = this.blockchainService.getERC20Contract(this.data.amount0Address);
        const quoteTokenContract = this.blockchainService.getERC20Contract(this.data.amount1Address);

        const baseBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(baseTokenContract));
        const quoteBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(quoteTokenContract));
        [this.baseBalance, this.quoteBalance] = [baseBalance, quoteBalance];

        this.baseBalance -= this.isOperationAsk() ? -this.buyAmount : this.sellAmount;
        this.quoteBalance -= this.isOperationAsk() ? this.sellAmount : -this.buyAmount;

      }
      }
    })
  }

  private isOperationAsk() {
    return this.operation == EOperationType.ASK;
  }

  initVariables() {
    this.sellAmount = 0;
    this.buyAmount = 0;
    this.baseBalance = 0;
    this.quoteBalance = 0;
    this.base = "";
    this.quote = "";
    this.bid = 0;
    this.ask = 0;
  }

  retrieveTradeData() {
    this.tradeData = this.tradeDataService.getData();
    this.connectionInfo = this.helperService.getConnectionInfo(this.tradeData.pair);
    this.pair = this.tradeData.pair;
    this.operation = this.tradeData.type;
    this.bid = this.tradeData.bid;
    this.ask = this.tradeData.ask;
    this.sellAmount = this.tradeData.amount;
    this.buyAmount = this.isOperationAsk() ? this.sellAmount/this.ask : this.sellAmount * this.bid;
  }

  executeTrade() {
    this.executionDataService.setData({
      type: this.operation,
      data: this.data,
      sellAmount: this.sellAmount,
      buyAmount: this.buyAmount,
      config: this.connectionInfo
    })
    this.router.navigate(['/transaction-status']);
  }
}
