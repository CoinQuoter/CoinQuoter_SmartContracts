import { TestBed } from '@angular/core/testing';

import { ExecutionDataGuardService } from './execution-data-guard.service';

describe('ExecutionDataGuardService', () => {
  let service: ExecutionDataGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExecutionDataGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
