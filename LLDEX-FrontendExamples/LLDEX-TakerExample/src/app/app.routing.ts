import { Route } from "@angular/router";
import { AppComponent } from "./app.component";
import { MetamaskGuardService } from './shared/guards/metamask-guard/metamask-guard.service';
import { SessionGuardService } from './shared/guards/session-guard/session-guard.service';
import { TradeDataGuardService } from './shared/guards/trade-data-guard/trade-data-guard.service';
import { ExecutionDataGuardService } from './shared/guards/execution-data-guard/execution-data-guard.service';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    loadChildren: () => import('./modules/live-rates/live-rates.module').then(m => m.LiveRatesModule)
  },
  {
    path: 'transaction-details',
    loadChildren: () => import('./modules/transaction-details/transaction-details.module').then(m => m.TransactionDetailsModule),
    canActivate: [MetamaskGuardService]
  },
  {
    path: 'trade',
    loadChildren: () => import('./modules/trade/trade.module').then(m => m.TradeModule),
    canActivate: [MetamaskGuardService, SessionGuardService, TradeDataGuardService]
  },
  {
    path: 'transaction-status',
    loadChildren: () => import('./modules/transaction-status/transaction-status.module').then(m => m.TransactionStatusModule),
    canActivate: [MetamaskGuardService, SessionGuardService, TradeDataGuardService, ExecutionDataGuardService]
  },

]
