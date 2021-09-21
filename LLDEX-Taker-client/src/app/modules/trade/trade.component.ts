import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConnectionInfo } from '../../shared/models/connection-info';
import { HelperService } from '../../shared/services/helper/helper.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit {

  connectionInfo: ConnectionInfo;

  constructor(private router: Router,
              private helperService: HelperService,
              private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.connectionInfo = this.helperService.getConnectionInfo(
        this.helperService.paramToPair(params.pair)
      );
    })
  }

}
