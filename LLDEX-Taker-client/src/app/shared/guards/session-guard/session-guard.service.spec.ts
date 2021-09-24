import { TestBed } from '@angular/core/testing';

import { SessionGuardService } from './session-guard.service';

describe('SessionGuardService', () => {
  let service: SessionGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
