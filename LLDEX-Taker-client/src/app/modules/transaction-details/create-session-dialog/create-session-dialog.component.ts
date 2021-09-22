import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { SessionService } from '../../../shared/services/session/session.service';
import { ethers } from 'ethers';
import { ProviderService } from '../../../shared/services/provider.service';
import { BlockchainService } from '../../../shared/services/blockchain/blockchain.service';


@Component({
  selector: 'app-create-session-dialog',
  templateUrl: './create-session-dialog.component.html',
  styleUrls: ['./create-session-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSessionDialogComponent implements OnInit {

  sessionTime: number;
  expirationDate: Date;
  formEnable: boolean;

  constructor(public ref: DynamicDialogRef,
              private sessionService: SessionService) { }

  ngOnInit(): void {
    this.formEnable = true;
    this.sessionTime = 300;
  }

  getSessionExpire() {
    const date = new Date();
    return new Date(date.getTime() + this.sessionTime*1000);
  }

  close() {
    this.ref.close();
  }

  createSession() {
    this.formEnable = false;
    this.expirationDate = this.getSessionExpire();
    this.sessionService.createSession(this.expirationDate)
      .then(() => window.location.reload());
  }
}
