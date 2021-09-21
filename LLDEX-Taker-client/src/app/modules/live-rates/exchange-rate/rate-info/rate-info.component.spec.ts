import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateInfoComponent } from './rate-info.component';

describe('RateInfoComponent', () => {
  let component: RateInfoComponent;
  let fixture: ComponentFixture<RateInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RateInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RateInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
