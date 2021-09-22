import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LiveRatesComponent } from './live-rates.component';
import { RouterModule } from "@angular/router";
import { ExchangeRateComponent } from './exchange-rate/exchange-rate.component';
import { RateInfoComponent } from './exchange-rate/rate-info/rate-info.component';
import { SharedModule } from '../../shared/shared.module';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';



@NgModule({
    declarations: [
        LiveRatesComponent,
        ExchangeRateComponent,
        RateInfoComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild([{path: '', component: LiveRatesComponent}]),
        SharedModule,
        ConfirmDialogModule,
        ToastModule
    ],
    exports: [
        ExchangeRateComponent
    ],
    providers: [
        DatePipe,
        ConfirmationService,
        MessageService
    ]
})
export class LiveRatesModule { }
