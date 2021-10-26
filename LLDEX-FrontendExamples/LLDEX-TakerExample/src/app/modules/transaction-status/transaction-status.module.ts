import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionStatusComponent } from './transaction-status.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';



@NgModule({
  declarations: [
    TransactionStatusComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {path: '', component: TransactionStatusComponent}
    ]),
    SharedModule,
    ProgressSpinnerModule
  ]
})
export class TransactionStatusModule { }
