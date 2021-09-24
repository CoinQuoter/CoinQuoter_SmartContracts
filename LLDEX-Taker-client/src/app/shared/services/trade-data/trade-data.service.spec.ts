import { TestBed } from '@angular/core/testing';

import { TradeDataService } from './trade-data.service';

describe('TradeDataService', () => {
  let service: TradeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradeDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
