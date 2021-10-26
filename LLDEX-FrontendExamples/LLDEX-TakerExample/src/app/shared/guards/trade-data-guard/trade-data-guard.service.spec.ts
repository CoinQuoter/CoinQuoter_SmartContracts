import { TestBed } from '@angular/core/testing';

import { TradeDataGuardService } from './trade-data-guard.service';

describe('TradeDataGuardService', () => {
  let service: TradeDataGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradeDataGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
