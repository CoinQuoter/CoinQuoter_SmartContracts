import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { BaseDataService } from '../../services/base-data/base-data.service';

@Injectable({
  providedIn: 'root'
})
export class BaseDataGuardService<T extends BaseDataService<any>> implements CanActivate{

  constructor(private router: Router,
              private dataService: T) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean{
    if(this.dataService.isDataSet()){
      return true;
    }
    this.router.navigate(['/transaction-details']);
    return false;
  }
}
