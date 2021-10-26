import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockchainService } from '../../../shared/services/blockchain/blockchain.service';

@Component({
  selector: 'app-allowance-dialog',
  templateUrl: './allowance-dialog.component.html',
  styleUrls: ['./allowance-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AllowanceDialogComponent implements OnInit {

  form: FormGroup;
  currencyName: string;
  status: string;

  constructor(public ref: DynamicDialogRef,
              public config: DynamicDialogConfig,
              private formBuilder: FormBuilder,
              private blockchainService: BlockchainService) { }

  ngOnInit(): void {
    this.status = 'idle';
    this.form = this.formBuilder.group({
      amount: [this.config.data.approveAmount, Validators.required]
    })
    this.currencyName = this.config.data.currency;
  }

  cancel() {
    this.ref.close();
  }

  updateAllowance() {
    this.status = 'waiting'

    this.form.disabled;
    this.blockchainService.updateAllowance(
      this.config.data.clientInfo,
      this.config.data.operation,
      this.form.get('amount').value )
      .then((data) => this.ref.close(data.promise))
      .catch((e) => this.status = 'idle');
  }

}
