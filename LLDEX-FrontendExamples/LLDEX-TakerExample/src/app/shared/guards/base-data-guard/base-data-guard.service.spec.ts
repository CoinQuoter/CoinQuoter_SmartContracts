import { TestBed } from '@angular/core/testing';

import { BaseDataGuardService } from './base-data-guard.service';

describe('BaseDataGuardService', () => {
  let service: BaseDataGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseDataGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
