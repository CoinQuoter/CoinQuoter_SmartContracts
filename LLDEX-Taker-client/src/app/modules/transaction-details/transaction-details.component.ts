import { Component, Inject, OnInit } from '@angular/core';
import { ECurrencyPair } from '../../shared/enums/currency-pair.constants';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProviderService, WEB3PROVIDER } from '../../shared/services/provider.service';
import { DialogService } from 'primeng/dynamicdialog';
import { AllowanceDialogComponent } from './allowance-dialog/allowance-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveRateService } from '../../shared/services/live-rate/live-rate.service';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { BigNumber, ethers } from 'ethers';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { CreateSessionDialogComponent } from './create-session-dialog/create-session-dialog.component';
import { SessionService } from '../../shared/services/session/session.service';
import { HelperService } from '../../shared/services/helper/helper.service';

const ABIERC20: string[] = [
  "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
  "function approve(address _spender, uint256 _value) public returns (bool success)",
  "function balanceOf(address) view returns (uint)"
];

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit {

  data: any;

  currencies: any[];
  form: FormGroup;

  sell: string;
  buy: string;

  approveAmount: number;
  allowanceDisplay: boolean;
  selectedPair: string;
  operation: string;
  connectionInfo: ConnectionInfo;

  ethBalance: number;
  sellBalance: number;
  buyBalance: number;
  bid: number;
  ask: number;

  constructor(private formBuilder: FormBuilder,
              @Inject(WEB3PROVIDER) private web3Provider,
              private providerService: ProviderService,
              private blockchainService: BlockchainService,
              private dialogService: DialogService,
              private route: ActivatedRoute,
              private router: Router,
              private liveRateService: LiveRateService,
              private sessionService: SessionService,
              private helperService: HelperService) { }

  ngOnInit(): void {
    this.initVariables();
    this.getParams();
    this.getBasicContractsInfo();
    this.initForm();
    this.splitCurrencyPair()
  }

  initVariables() {
    this.approveAmount = 0;
    this.ethBalance = 0;
    this.sellBalance = 0;
    this.buyBalance = 0;
    this.bid = 0;
    this.ask = 0;

    this.allowanceDisplay = false;
    this.currencies = Object.values(ECurrencyPair);
    this.selectedPair = this.currencies[0];

  }

  getBasicContractsInfo() {
    this.connectionInfo = this.getConnectionInfo();
    this.liveRateService.getLiveRate(this.connectionInfo).addListener({message: async event => {
        this.data = event.message.content.data;
        const limitOrderProtocolAddress = this.data.contractAddress;
        const sellAddress = this.data.amount0Address;
        const buyAddress = this.data.amount1Address;

        const sellTokenContract = new ethers.Contract(sellAddress, ABIERC20, this.providerService);
        const buyTokenContract = new ethers.Contract(buyAddress, ABIERC20, this.providerService);
        const currentContact = this.operation == "sell" ? sellTokenContract : buyTokenContract;

        const takerAddress = this.blockchainService.getSignerAddress();

        //TODO: wprowadzić dwie zmienne do approve amount, żeby przy zamianie stron nie trzeba było czekać
        this.approveAmount =
          this.toNumber(await currentContact.connect(takerAddress).allowance(takerAddress, limitOrderProtocolAddress),
            this.data.amount0Dec);

        this.ethBalance = this.toNumber(await this.providerService.getBalance(takerAddress), this.data.amount0Dec);
        const sellBalance = this.toNumber(await sellTokenContract.connect(takerAddress).balanceOf(takerAddress), this.data.amount0Dec);

        const buyBalance = this.toNumber(
          await buyTokenContract.connect(takerAddress).balanceOf(takerAddress), this.data.amount0Dec
        );
        [this.sellBalance, this.buyBalance] = this.operation === "sell" ? [sellBalance, buyBalance] : [buyBalance, sellBalance];
        [this.bid, this.ask] = this.operation === "sell" ? [this.data.bid, this.data.ask] : [this.data.ask, this.data.bid];

        this.form.get('sellAmount').addValidators(Validators.max(this.approveAmount));
      } });
  }

  initForm() {
    this.form = this.formBuilder.group({
      currencyPair: [this.selectedPair, Validators.required],
      sellAmount: [0, [Validators.required]]
    })
  }

  splitCurrencyPair() {
    [this.sell, this.buy] = this.form.get('currencyPair').value.split("/");
    if(this.operation === "buy") {
      [this.sell, this.buy] = [this.buy, this.sell];
      [this.sellBalance, this.buyBalance] = [this.buyBalance, this.sellBalance];
    }
  }

  changeCurrencySides() {
    [this.sell, this.buy] = [this.buy, this.sell];
    [this.sellBalance, this.buyBalance] = [this.buyBalance, this.sellBalance];
    this.operation = this.operation === "buy" ? "sell" : "buy";
    this.router.navigate([], {relativeTo: this.route, queryParams:
        { type: this.operation }, queryParamsHandling: 'merge'})
  }

  getConnectionInfo(){
    return this.helperService.getConnectionInfo(this.selectedPair);
  }

  getParams(){
    this.route.queryParams.subscribe( (params) => {
      this.selectedPair = this.helperService.paramToPair(params['pair'] ?? this.currencies[0]);
      this.operation = params['type'] ?? "sell";
    })
  }

  changePair() {
    const pair = this.helperService.pairToParam(this.form.get('currencyPair').value);
    this.router.navigate([], {relativeTo: this.route, queryParams:
        { pair: pair, type: this.operation }, queryParamsHandling: 'merge'});
    this.splitCurrencyPair();
    this.connectionInfo = this.getConnectionInfo();
  }

  toNumber(number: BigNumber, accuraccy: number): number {
    return Number(number)/Math.pow(10, accuraccy)
  }

  showAllowanceDialog() {
    const ref = this.dialogService.open(AllowanceDialogComponent, {
      header: 'Allowance',
      width: '40vw',
      data: {
        approveAmount: this.approveAmount,
        currency: this.sell,
        clientInfo: this.data,
        operation: this.operation
      }
    })

    ref.onClose.subscribe((val)  => {
      if(val && val > this.approveAmount) console.log(val);
    });
  }

  showCreateSessionDialog() {
    const ref = this.dialogService.open(CreateSessionDialogComponent, {
      header: 'Session creator',
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
    this.router.navigate(['/trade'], { queryParams: {
      pair: this.helperService.paramToPair(this.selectedPair)
    }
  })
  }

}
