import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ExecutionDataService } from '../../services/execution-data/execution-data.service';
import { BaseDataGuardService } from '../base-data-guard/base-data-guard.service';

@Injectable({
  providedIn: 'root'
})
export class ExecutionDataGuardService extends BaseDataGuardService<ExecutionDataService>{

  constructor(_router: Router,
              _executionDataService: ExecutionDataService) {

    super(_router, _executionDataService);
  }

}
