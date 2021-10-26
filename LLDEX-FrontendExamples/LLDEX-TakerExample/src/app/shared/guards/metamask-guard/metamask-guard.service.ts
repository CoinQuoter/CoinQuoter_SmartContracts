import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { WEB3PROVIDER } from '../../services/provider/provider.service';
import { BlockchainService } from '../../services/blockchain/blockchain.service';
import { DialogService } from 'primeng/dynamicdialog';
import { NoExtensionInstalledDialogComponent } from '../../components/no-extension-installed-dialog/no-extension-installed-dialog.component';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class MetamaskGuardService implements CanActivate{

  constructor(private blockchainService: BlockchainService,
              private router: Router,
              private messageService: MessageService) { }

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): boolean {
      if (!this.blockchainService.isProviderAvailable()
      ) {
        this.router.navigate(['/']).then(() => {
          this.messageService.add({
            severity: "warn",
            summary: "Warning",
            detail: "No wallet extension is installed"
          })
        });
      }

      if (!this.blockchainService.isChainSupported()) {
        this.router.navigate(['/']).then(() => {
          this.messageService.add({
            severity: "warn",
            summary: "Warning",
            detail: "Invalid network - please switch to supported network"
          })
        });
      }
      

      return true;
  }
}
