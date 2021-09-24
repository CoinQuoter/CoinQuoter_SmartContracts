import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockchainService } from '../../../shared/services/blockchain/blockchain.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-allowance-dialog',
  templateUrl: './allowance-dialog.component.html',
  styleUrls: ['./allowance-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AllowanceDialogComponent implements OnInit {

  form: FormGroup;
  currencyName: string;

  constructor(public ref: DynamicDialogRef,
              public config: DynamicDialogConfig,
              private formBuilder: FormBuilder,
              private blockchainService: BlockchainService,
              private messageService: MessageService) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      amount: [this.config.data.approveAmount, Validators.required]
    })
    this.currencyName = this.config.data.currency;
  }

  cancel() {
    this.ref.close();
  }

  updateAllowance() {
    this.form.disabled;
    this.blockchainService.updateAllowance(
      this.config.data.clientInfo,
      this.config.data.operation,
      this.form.get('amount').value )
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Allowance updated',
          detail: 'Allowance updated successfully.'
        })
        this.ref.close();
      })
      .catch((e) => {
        console.log(e);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'There was an error during this operation.'
        })
        this.ref.close();
      });
  }

}
