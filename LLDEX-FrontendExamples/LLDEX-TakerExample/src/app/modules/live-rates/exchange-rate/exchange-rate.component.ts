import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { PubnubService } from '../../../shared/services/pubnub/pubnub.service';
import { ConnectionInfo } from '../../../shared/models/connection-info';
import { DatePipe } from '@angular/common';
import { EOperationType } from '../../../shared/enums/operation-type.constants';
import { PubnubQuoteConfig } from 'app/shared/constants/config.constants';

@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExchangeRateComponent implements OnInit, OnDestroy {

  @Input() connection: ConnectionInfo;

  today: string;
  bidRate: number = 0;
  askRate: number = 0;
  lastDifference: number = 0;
  difference: number = 0;

  EBid: number;
  EAsk: number;
  pubnubClient: any;

  constructor(private liveRateService: PubnubService,
              private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.today = this.datePipe.transform(new Date(), 'd MMM').toUpperCase();
    this.pubnubClient = this.liveRateService.connect(this.connection, PubnubQuoteConfig)
    this.pubnubClient.addListener({message: event => {
        this.lastDifference = this.difference;
        this.bidRate = event.message.content.data.bid;
        this.askRate = event.message.content.data.ask;
        this.difference = (this.askRate - this.bidRate);
      } }, 1000);

    this.EBid = EOperationType.BID;
    this.EAsk = EOperationType.ASK;
  }

  ngOnDestroy(): void {
    this.pubnubClient.disconnect();
  }

  isDifferenceBigger(): boolean {
    return this.lastDifference <= this.difference;
  }

  isDifferenceLower(): boolean {
    return this.lastDifference > this.difference;
  }

  getRedirectRoute(type: number) {
    return { queryParams: {
      pair: this.connection.title.toLowerCase().replace("/", "_"),
      type: type
    }}
  }
}
