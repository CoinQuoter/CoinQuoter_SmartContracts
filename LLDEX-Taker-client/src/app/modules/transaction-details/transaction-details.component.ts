import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ECurrencyPair } from '../../shared/enums/currency-pair.constants';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ProviderService, WEB3PROVIDER } from '../../shared/services/provider/provider.service';
import { DialogService } from 'primeng/dynamicdialog';
import { AllowanceDialogComponent } from './allowance-dialog/allowance-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PubnubService } from '../../shared/services/pubnub/pubnub.service';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { BigNumber, ethers } from 'ethers';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { CreateSessionDialogComponent } from '../../shared/components/create-session-dialog/create-session-dialog.component';
import { SessionService } from '../../shared/services/session/session.service';
import { HelperService } from '../../shared/services/helper/helper.service';
import { EOperationType } from '../../shared/enums/operation-type.constants';
import { TradeDataService } from '../../shared/services/trade-data/trade-data.service';
import { FILLORDER_RFQ_ESTIMATED_GAS_USAGE } from '../../shared/constants/config.constants';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {

  data: any;

  currencies: any[];
  form: FormGroup;

  base: string;
  quote: string;
  sellToken: string;
  buyToken: string;

  approveAmount: number;
  allowanceDisplay: boolean;
  selectedPair: string;
  operation: number;
  connectionInfo: ConnectionInfo;

  ethBalance: number;
  baseBalance: number;
  quoteBalance: number;
  bidRate: number;
  askRate: number;
  sellAmount: number;
  sellBalance: number;
  pubnubClient: any;
  gasPrice: number;
  blockButton: boolean;
  maxLiquidity: number;

  constructor(private formBuilder: FormBuilder,
              @Inject(WEB3PROVIDER) private web3Provider,
              private providerService: ProviderService,
              private blockchainService: BlockchainService,
              private dialogService: DialogService,
              private route: ActivatedRoute,
              private router: Router,
              private pubnubService: PubnubService,
              private sessionService: SessionService,
              private helperService: HelperService,
              private tradeDataService: TradeDataService) { }

  ngOnInit(): void {
    this.initVariables();
    this.getParams();
    this.getBasicContractsInfo();
    this.initForm();
    this.splitCurrencyPair()
  }

  ngOnDestroy(): void {
    this.pubnubClient.disconnect();
  }

  initVariables() {
    this.approveAmount = 0;
    this.ethBalance = 0;
    this.baseBalance = 0;
    this.quoteBalance = 0;
    this.bidRate = 0;
    this.askRate = 0;
    this.sellBalance = 0;
    this.gasPrice = 0;
    this.maxLiquidity = 0;

    this.blockButton = true;
    this.allowanceDisplay = false;
    this.currencies = Object.values(ECurrencyPair);
    this.selectedPair = this.currencies[0];

  }

  getBasicContractsInfo() {
    this.connectionInfo = this.getConnectionInfo();
    this.pubnubClient = this.pubnubService.connect(this.connectionInfo)
      this.pubnubClient.addListener({message: async event => {
        if(event.message.content.type == "stream_depth"){
          this.data = event.message.content.data;
          this.blockButton = false;

          this.helperService.setAccuracy(this.isOperationAsk() ? this.data.amount1Dec : this.data.amount0Dec);

          this.gasPrice = (this.helperService.toNumber(await this.providerService.getGasPrice())
            *FILLORDER_RFQ_ESTIMATED_GAS_USAGE);
          let sellTokenBalance = 0;

          if(this.isWalletConnected()){
            const sellTokenContract = this.blockchainService.getERC20Contract(this.data.amount0Address);
            const buyTokenContract = this.blockchainService.getERC20Contract(this.data.amount1Address);
            const currentContact = this.isOperationAsk() ? buyTokenContract : sellTokenContract;

            this.maxLiquidity = this.isOperationAsk() ? this.data.maxToken0 : this.data.maxToken1;

            this.maxLiquidity = this.isOperationAsk() ? (this.maxLiquidity * this.data.bid)*0.99 : (this.maxLiquidity/this.data.ask)*0.99;

            this.approveAmount = this.helperService.toNumber(
              await this.blockchainService.getAllowanceAmount(currentContact, this.data.contractAddress)
            );
            this.ethBalance = this.helperService.toNumber(await this.blockchainService.getBalance());
            const sellBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(sellTokenContract));
            const buyBalance = this.helperService.toNumber(await this.blockchainService.getTokenBalance(buyTokenContract));

            [this.baseBalance, this.quoteBalance] = [sellBalance, buyBalance];
            this.sellBalance = this.isOperationAsk() ? buyBalance : sellBalance;
            sellTokenBalance = this.isOperationAsk() ? buyBalance : sellBalance;
          }
          [this.bidRate, this.askRate] = [this.data.bid, this.data.ask];

          const formSellAmount = this.form.get('sellAmount');
          formSellAmount.setValidators([
            Validators.required,
            this.allowanceValidator(this.approveAmount),
            this.sellTokenBalanceValidator(sellTokenBalance),
            this.liquidityValidator(this.maxLiquidity)])
        }
        }
    });
  }

  private isOperationAsk() {
    return this.operation == EOperationType.ASK;
  }

  initForm() {
    this.form = this.formBuilder.group({
      currencyPair: [this.selectedPair, Validators.required],
      sellAmount: [this.sellAmount, [Validators.required]]
    })
  }

  splitCurrencyPair() {
    [this.base, this.quote] = this.form.get('currencyPair').value.split("/");
    [this.sellToken, this.buyToken] = this.isOperationAsk() ? [this.quote, this.base] : [this.base, this.quote];
  }

  changeCurrencySides(buttonType: number) {
    if(!this.isOperationSelected(buttonType)){
      [this.sellToken, this.buyToken] = [this.buyToken, this.sellToken];
      this.operation = this.isOperationAsk() ? EOperationType.BID : EOperationType.ASK;
      this.router.navigate([], {relativeTo: this.route, queryParams:
          { type: this.operation }, queryParamsHandling: 'merge'})
    }
  }

  isOperationSelected(buttonType: number) {
    return buttonType == this.operation;
  }

  getConnectionInfo(){
    return this.helperService.getConnectionInfo(this.selectedPair);
  }

  getParams(){
    this.route.queryParams.subscribe( (params) => {
      this.selectedPair = this.helperService.paramToPair(params.pair ?? this.currencies[0]);
      this.operation = params.type ?? EOperationType.BID;
      this.sellAmount = params.amount ?? 0;
    })
  }

  changePair() {
    const pair = this.helperService.pairToParam(this.form.get('currencyPair').value);
    this.router.navigate([], {relativeTo: this.route, queryParams:
        { pair: pair, type: this.operation }, queryParamsHandling: 'merge'});
    this.splitCurrencyPair();
    this.getParams();
    this.selectedPair = this.form.controls.currencyPair.value;
    this.connectionInfo = this.getConnectionInfo();
    this.pubnubClient.disconnect();
    this.getBasicContractsInfo();
  }


  showAllowanceDialog() {
    const ref = this.dialogService.open(AllowanceDialogComponent, {
      header: 'Allowance',
      width: '40vw',
      data: {
        approveAmount: this.approveAmount,
        currency: this.sellToken,
        clientInfo: this.data,
        operation: this.operation
      }
    })
  }

  showCreateSessionDialog() {
    const ref = this.dialogService.open(CreateSessionDialogComponent, {
      header: 'Start session',
      width: '40vw',
    })
  }

  isSession() {
    return this.sessionService.isSession();
  }

  disableQuote(): boolean {
    const value = this.form.get("sellAmount").value;
    return value <= 0 || value > this.approveAmount;
  }

  getQuote() {
    this.router.navigate(['/trade']);
    this.tradeDataService.setData({
      pair: this.selectedPair,
      type: this.operation,
      amount: this.form.get("sellAmount").value,
      ask: this.askRate,
      bid: this.bidRate,
      gasPrice: this.gasPrice,
    })
  }

  sellTokenBalanceValidator(balance: number): ValidatorFn {
    return this.exceededValidator(balance, 'sellTokenBalance');
  }

  allowanceValidator(allowance: number): ValidatorFn {
    return this.exceededValidator(allowance, 'allowance');
  }

  liquidityValidator(liquitidy: number): ValidatorFn {
    return this.exceededValidator(liquitidy, 'liquidity');
  }

  private exceededValidator(max: number, keyName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if(control.value > max) return { [keyName]: true}
      else return null;
    }
  }

  isWalletConnected():boolean {
    return this.blockchainService.isLogged();
  }

  connectToWallet() {
    this.blockchainService.requestAccount();
    window.location.reload();
  }
}
