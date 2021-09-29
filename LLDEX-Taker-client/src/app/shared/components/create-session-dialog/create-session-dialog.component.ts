import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SessionService } from '../../services/session/session.service';
import { ethers } from 'ethers';
import { ProviderService } from '../../services/provider/provider.service';
import { BlockchainService } from '../../services/blockchain/blockchain.service';


@Component({
  selector: 'app-create-session-dialog',
  templateUrl: './create-session-dialog.component.html',
  styleUrls: ['./create-session-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSessionDialogComponent implements OnInit {

  form: FormGroup;
  selectedButton: number;
  sessionTime: number;
  expirationDate: Date;
  formEnable: boolean;

  constructor(public ref: DynamicDialogRef,
              private sessionService: SessionService,
              private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.selectedButton = 1;
    this.formEnable = true;
    this.sessionTime = 300;
    this.form = this.formBuilder.group({
      sessionLength: [null]
    })
  }

  getSessionExpire() {
    const date = new Date();
    this.setSessionTime();
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

  changeButton(value: number) {
    this.selectedButton = value;
  }
  setSessionTime() {
    switch(this.selectedButton){
      case 1:
        this.sessionTime = 300;
        break;
      case 2:
        this.sessionTime = 900;
        break;
      case 3:
        this.sessionTime = 1800;
        break;
      case 4:
        this.sessionTime = this.isSessionLengthValid() ? this.form.get('sessionLength').value*60 : 300;
        break;
      default:
        this.sessionTime = 300;
        break;
    }
  }

  formIsValid() {
    return (this.selectedButton == 4 && this.isSessionLengthValid())
    || this.selectedButton == 3 || this.selectedButton == 2 || this.selectedButton == 1;
  }

  private isSessionLengthValid(): boolean {
    const sessionLength = this.form.get('sessionLength').value;
    return sessionLength > 0 && !!sessionLength && !isNaN(sessionLength);
  }
}
