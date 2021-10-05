import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionService } from '../../shared/services/session/session.service';
import { BlockchainService } from '../../shared/services/blockchain/blockchain.service';
import { ProviderService } from '../../shared/services/provider/provider.service';
import { CreateSessionDialogComponent } from '../../shared/components/create-session-dialog/create-session-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { NoExtensionInstalledDialogComponent } from '../../shared/components/no-extension-installed-dialog/no-extension-installed-dialog.component';
import { MessageService } from 'primeng/api';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @ViewChild('op', {static: false}) model;
  session: boolean;
  chainSupported: boolean;
  timeLeft: number;
  address: string;
  sessionPublicKey: string;
  expirationTimeStamp: Date;
  shortWalletAddress: string;
  chainName: string;
  walletAddress: string;
  sessionStatus: string;
  terminationStatus: string;

  constructor(private sessionService: SessionService,
              private blockchainService: BlockchainService,
              private providerService: ProviderService,
              private dialogService: DialogService,
              private messageService: MessageService) { }

  ngOnInit(): void {
    this.chainSupported = true;
    this.session = false;
    this.sessionStatus = 'idle';
    this.terminationStatus = 'idle';

    if (!this.blockchainService.isProviderAvailable())
      return;

    this.fetchChainName();

    this.blockchainService.onAccountChanged((_) => {
      if (this.chainSupported)
        window.location.reload();
    });

    this.blockchainService.onChainChanged((chainId, _) => {
      this.fetchChainName();
      this.chainSupported = this.blockchainService.isChainSupported();

      if (this.chainSupported)
        this.initializeClient();
    });

    if (!this.blockchainService.isChainSupported())
      return;

    this.initializeClient();
  }

  initializeClient() {
    this.blockchainService.getSignerAddress().then(() => {
      this.setWallet();

      const LOPContract = this.sessionService.getLOPContract();
      const signer = this.providerService.getSigner(0);
      signer.getAddress().then((address) => {
        LOPContract.connect(signer).sessionExpirationTime(address).then((expirationTime) => {
          this.expirationTimeStamp = new Date(Number(expirationTime.toString()) * 1000);
          const dateNow = new Date().getTime() / 1000;
          const session = this.sessionService.getSessionDetails();

          if (expirationTime > dateNow && 
              session && 
              session.session_private_key
            ) {
            LOPContract.connect(signer).session(address).then((
              data: any
            ) => {
              // Check whether session public key on blockchain is the same 
              // as the public key derived from private key stored in local storage
              if (!this.blockchainService.validatePrivateKey(session.session_private_key, data.sessionKey))
                return;

              this.session = true;
              this.address = address;
              this.sessionPublicKey = data.sessionKey;
              this.sessionService.setIsSession(true);

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
            })
          }
        });
      });
    }).catch(() => 'error');
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

  isNetworkSupported(): boolean {
    return this.blockchainService.isChainSupported();
  }

  connectToWallet(){
    if (this.blockchainService.isProviderAvailable()){
      this.blockchainService.requestAccount().then(() => this.setWallet());
    } else{
      this.messageService.add({
        severity: "warn",
        summary: "Warning",
        detail: "No wallet extension is installed"
      })
    }
  }

  async setWallet() {
    this.walletAddress = await this.blockchainService.getSignerAddress();
    this.shortWalletAddress = this.walletAddress.slice(0, 6) + "..." + this.walletAddress.slice(-4);
  }

  async fetchChainName() {
    this.chainName = (await this.blockchainService.getChainName());
  }


  endSession() {
    this.terminationStatus = 'waiting';

    this.sessionService.endSession()
      .then((data) => {
        this.model.hide();
        this.terminationStatus = 'completing';

        data.promise
          .then(() => window.location.reload())
          .catch(() => this.terminationStatus = 'idle')
        
      })
      .catch(() => this.terminationStatus = 'idle');
  }

  showCreateSessionDialog() {
    if (!this.isNetworkSupported())
      return;

    const ref = this.dialogService.open(CreateSessionDialogComponent, {
      header: 'Start session',
      width: '40vw',
    }).onClose.pipe(take(1)).subscribe((sessionPromise) => {
      if (!sessionPromise)
        return;

      this.sessionStatus = 'waiting';
      sessionPromise
        .then(() => window.location.reload())
        .catch(() => this.sessionStatus = 'idle');
    });
  }
}
