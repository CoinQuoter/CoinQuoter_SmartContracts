import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { LiveRateService } from '../../../shared/services/live-rate/live-rate.service';
import { ConnectionInfo } from '../../../shared/models/connection-info';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExchangeRateComponent implements OnInit {

  @Input() connection: ConnectionInfo;

  today: string;
  sellPrice: number = 13.3562;
  buyPrice: number = 13.3623;
  lastDifference: number = 0;
  difference: number = 0;

  constructor(private liveRateService: LiveRateService,
              private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.today = this.datePipe.transform(new Date(), 'd MMM').toUpperCase();
    this.liveRateService.getLiveRate(this.connection).addListener({message: event => {
        this.lastDifference = this.difference;
        this.sellPrice = event.message.content.data.bid;
        this.buyPrice = event.message.content.data.ask;
        this.difference = (this.buyPrice - this.sellPrice)
          * 10000 / Math.pow(10, Number(this.buyPrice.toString().split('.')[0].length-1));
      } });
  }

  isDifferenceBigger(): boolean {
    return this.lastDifference < this.difference;
  }

  isDifferenceLower(): boolean {
    return this.lastDifference > this.difference;
  }

  getRedirectRoute(type: string) {
    return { queryParams: {
      pair: this.connection.title.toLowerCase().replace("/", "_"),
      type: type
    }}
  }
}
