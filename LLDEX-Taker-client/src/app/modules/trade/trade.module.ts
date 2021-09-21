import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeComponent } from './trade.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    TradeComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        RouterModule.forChild([{path: '', component: TradeComponent}])
    ]
})
export class TradeModule { }
