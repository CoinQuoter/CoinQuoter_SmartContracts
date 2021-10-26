import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { TradeDataService } from '../../services/trade-data/trade-data.service';
import { BaseDataGuardService } from '../base-data-guard/base-data-guard.service';

@Injectable({
  providedIn: 'root'
})
export class TradeDataGuardService extends BaseDataGuardService<TradeDataService>{

  constructor(_router: Router,
              _tradeDataService: TradeDataService) {
    super(_router, _tradeDataService);
  }
}
