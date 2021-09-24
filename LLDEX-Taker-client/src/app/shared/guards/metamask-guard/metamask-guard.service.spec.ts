import { TestBed } from '@angular/core/testing';

import { MetamaskGuardService } from './metamask-guard.service';

describe('AuthGuardService', () => {
  let service: MetamaskGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetamaskGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
