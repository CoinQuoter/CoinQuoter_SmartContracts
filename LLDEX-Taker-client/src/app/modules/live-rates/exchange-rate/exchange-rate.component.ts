import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { PubnubService } from '../../../shared/services/pubnub/pubnub.service';
import { ConnectionInfo } from '../../../shared/models/connection-info';
import { DatePipe } from '@angular/common';
import { EOperationType } from '../../../shared/enums/operation-type.constants';

@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExchangeRateComponent implements OnInit {

  @Input() connection: ConnectionInfo;

  today: string;
  bidRate: number = 13.3562;
  askRate: number = 13.3623;
  lastDifference: number = 0;
  difference: number = 0;

  EBid: number;
  EAsk: number;

  constructor(private liveRateService: PubnubService,
              private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.today = this.datePipe.transform(new Date(), 'd MMM').toUpperCase();
    this.liveRateService.connect(this.connection).addListener({message: event => {
        this.lastDifference = this.difference;
        this.bidRate = event.message.content.data.bid;
        this.askRate = event.message.content.data.ask;
        this.difference = (this.askRate - this.bidRate)
          * 10000 / Math.pow(10, Number(this.askRate.toString().split('.')[0].length-1));
      } });

    this.EBid = EOperationType.BID;
    this.EAsk = EOperationType.ASK;
  }

  isDifferenceBigger(): boolean {
    return this.lastDifference < this.difference;
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
