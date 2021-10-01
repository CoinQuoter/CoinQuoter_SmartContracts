import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import Decimal from 'decimal.js';
import { PubnubQuoteConfig } from 'app/shared/constants/config.constants';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit, OnDestroy {

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
  price: number;
  gasPrice: number;

  base: string;
  quote: string;
  sellToken: string;
  buyToken: string;
  pair: string;
  disableButton: boolean;
  pubnubClient: any;

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
    

    this.pubnubClient = this.liveRateService.connect(this.connectionInfo, PubnubQuoteConfig)
    this.pubnubClient .addListener({ message: async event => {
      if(event.message.content.type == "stream_depth") {
        this.data = event.message.content.data;

        const baseTokenContract = this.blockchainService.getERC20Contract(this.data.amount0Address);
        const quoteTokenContract = this.blockchainService.getERC20Contract(this.data.amount1Address);

        this.bid = this.data.bid;
        this.ask = this.data.ask;
        this.buyAmount = this.isOperationAsk() ? this.sellAmount/this.ask : this.sellAmount * this.bid;

        this.helperService.setAccuracy(this.data.amount0Dec)
        let baseBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(baseTokenContract));

        this.helperService.setAccuracy(this.data.amount1Dec)
        let quoteBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(quoteTokenContract));

        baseBalance -= this.isOperationAsk() ? -this.buyAmount : this.sellAmount;
        quoteBalance -= this.isOperationAsk() ? this.sellAmount : -this.buyAmount;
        this.price = this.isOperationAsk() ? this.ask : this.bid;
        [this.baseBalance, this.quoteBalance] = this.isOperationAsk() ? [quoteBalance, baseBalance] : [baseBalance, quoteBalance];
        this.disableButton = false;
      }
      }
    })
  }

  ngOnDestroy(): void {
    this.pubnubClient.disconnect();
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
    this.price = 0;
    this.gasPrice = 0;
    this.disableButton = true;
  }

  retrieveTradeData() {
    this.tradeData = this.tradeDataService.getData();
    this.connectionInfo = this.helperService.getConnectionInfo(this.tradeData.pair);
    this.pair = this.tradeData.pair;
    this.operation = this.tradeData.type;
    // this.bid = this.tradeData.bid;
    // this.ask = this.tradeData.ask;
    this.sellAmount = this.tradeData.amount;
    // this.buyAmount = this.isOperationAsk() ? this.sellAmount/this.ask : this.sellAmount * this.bid;
    this.gasPrice = this.tradeData.gasPrice;
  }

  executeTrade() {
    this.executionDataService.setData({
      type: this.operation,
      data: this.data,
      sellAmount: this.sellAmount,
      buyAmount: this.buyAmount,
      config: this.connectionInfo,
      price: this.price,
      sellBalance: this.baseBalance,
      buyBalance: this.quoteBalance,
      sellToken: this.sellToken,
      buyToken: this.buyToken,
      gasPrice: this.gasPrice,
    })
    this.router.navigate(['/transaction-status']);
  }
}
