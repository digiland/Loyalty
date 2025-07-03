import { TestBed } from '@angular/core/testing';

import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoyaltyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
