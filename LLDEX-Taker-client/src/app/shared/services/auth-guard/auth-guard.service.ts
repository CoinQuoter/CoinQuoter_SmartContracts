import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { WEB3PROVIDER } from '../provider.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate{

  constructor(private blockchainService: BlockchainService,
              private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Promise((resolve) => {
      if(this.blockchainService.isLogged()){
        return resolve(true);
      }
      this.router.navigate(['/']);
      return false;
    })
  }
}
