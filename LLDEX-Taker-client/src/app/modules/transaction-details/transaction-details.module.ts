import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionDetailsComponent } from './transaction-details.component';
import { RouterModule } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AllowanceDialogComponent } from './allowance-dialog/allowance-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CreateSessionDialogComponent } from '../../shared/components/create-session-dialog/create-session-dialog.component';
import { SliderModule } from 'primeng/slider';
import { SharedBrowserSpinnerModule } from 'app/shared/shared.browser.spinner.module';

@NgModule({
  declarations: [
    TransactionDetailsComponent,
    AllowanceDialogComponent,
    CreateSessionDialogComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild([{path: '', component: TransactionDetailsComponent}]),
        DropdownModule,
        ButtonModule,
        InputNumberModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        ToastModule,
        SliderModule,
        SharedBrowserSpinnerModule
    ],
  providers:[
    DialogService,
    MessageService
  ],
})
export class TransactionDetailsModule { }
