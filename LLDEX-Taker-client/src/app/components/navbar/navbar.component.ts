import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../shared/services/session/session.service';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { ProviderService } from '../../shared/services/provider/provider.service';
import { CreateSessionDialogComponent } from '../../shared/components/create-session-dialog/create-session-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { NoExtensionInstalledDialogComponent } from '../../shared/components/no-extension-installed-dialog/no-extension-installed-dialog.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  session: boolean;
  timeLeft: number;
  address: string;
  sessionPublicKey: string;
  expirationTimeStamp: Date;
  shortWalletAddress: string;
  walletAddress: string;

  constructor(private sessionService: SessionService,
              private blockchainService: BlockchainService,
              private providerService: ProviderService,
              private dialogService: DialogService,
              private messageService: MessageService) { }

  ngOnInit(): void {
    this.session = false;
    if(this.blockchainService.isExtensionInstalled()){
      this.blockchainService.getSignerAddress().then(() => {
        this.setWallet();
        const LOPContract = this.sessionService.getLOPContract();
        const signer = this.providerService.getSigner(0);
        signer.getAddress().then((address) => {
          LOPContract.connect(signer).sessionExpirationTime(address).then((expirationTime) => {
            this.expirationTimeStamp = new Date(Number(expirationTime.toString()) * 1000);
            const dateNow = new Date().getTime() / 1000;
            if (expirationTime > dateNow) {
              this.session = true;
              this.sessionService.setIsSession(true);
              const session = this.sessionService.getSessionDetails();
              this.address = session.session_creator;
              this.sessionPublicKey = session.session_public_key;
              let timerInteval = setInterval(() => {
                let now = new Date().getTime();
                this.timeLeft = this.expirationTimeStamp.getTime() - now;
                if (this.timeLeft <= 0) {
                  this.sessionService.clearStorage();
                  this.session = false;
                  this.sessionService.setIsSession(false);
                  clearInterval(timerInteval);
                }
              });
            }
          });
        });
      }).catch(() => 'error');
    }
    // this.sessionService.isSession().then((isSession) => {
    //   console.log(isSession);
    //   this.session = isSession;
    //   if(this.session) {
    //     this.sessionService.getTimeLeft().then((timeLeft) => {
    //       this.timeLeft = timeLeft;
    //       let timer = setInterval(() => {
    //         this.timeLeft -= 1000;
    //         if( this.timeLeft <= 0 ) {
    //           this.sessionService.clearStorage();
    //           this.session = false;
    //           window.location.reload();
    //           clearInterval(timer);
    //         }
    //       }, 1000);
    //     });
    //     const session = this.sessionService.getSessionDetails();
    //     this.address = session.session_creator;
    //     this.sessionPublicKey = session.session_public_key;
    //     this.expirationTimeStamp = this.sessionService.getExpirationTimeStamp();
    //   }
    // });
  }

  getCountdown(): string {
    let days = Math.floor(this.timeLeft / (1000 * 60 * 60 * 24));
    let hours = Math.floor((this.timeLeft % (1000 * 60 * 60 * 24)) / (1000*60*60));
    let minutes = Math.floor((this.timeLeft % (1000 * 60 * 60))/(1000*60));
    let seconds = Math.floor((this.timeLeft % (1000 * 60)) / 1000);

    let daysT = days === 0 ? '' : `${days}:`;
    let hoursT = hours < 10 || (hours == 0 && days > 0) ? `0${hours}:` : `${hours}:`;
    hoursT = hours == 0 && days == 0 ? '' : hoursT;
    let minutesT = minutes < 10 || (minutes == 0 && hours > 0) ? `0${minutes}:` : `${minutes}:`;
    minutesT = minutes == 0 && hours == 0 ? '' : minutesT;
    let secondsT = seconds < 10 ? `0${seconds}` :  `${seconds}`

    return  daysT + hoursT + minutesT + secondsT;
  }

  isWalletConnected(): boolean {
    return this.blockchainService.isLogged();
  }

  connectToWallet(){
    if(this.blockchainService.isExtensionInstalled()){
      this.blockchainService.requestAccount().then(() => this.setWallet());
    }else{
      this.messageService.add({
        severity: "warn",
        summary: "Warning",
        detail: "No wallet extension is installed"
      })
    }
  }
  async setWallet() {
    this.walletAddress = await this.blockchainService.getSignerAddress()
    this.shortWalletAddress = this.walletAddress.slice(0, 6) + "..." + this.walletAddress.slice(-4);
  }

  endSession() {
    this.sessionService.endSession().then(() => window.location.reload());
  }

  showCreateSessionDialog() {
    const ref = this.dialogService.open(CreateSessionDialogComponent, {
      header: 'Start session',
      width: '40vw',
    })
  }
}
