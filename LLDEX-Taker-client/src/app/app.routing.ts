import { Route } from "@angular/router";
import { AppComponent } from "./app.component";
import { AuthGuardService } from './shared/services/auth-guard/auth-guard.service';
import { SessionGuardService } from './shared/services/session-guard/session-guard.service';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    loadChildren: () => import('./modules/live-rates/live-rates.module').then(m => m.LiveRatesModule)
  },
  {
    path: 'transaction-details',
    loadChildren: () => import('./modules/transaction-details/transaction-details.module').then(m => m.TransactionDetailsModule),
    canActivate: [AuthGuardService]
  },
  {
    path: 'trade',
    loadChildren: () => import('./modules/trade/trade.module').then(m => m.TradeModule),
    canActivate: [SessionGuardService]
  }
]
