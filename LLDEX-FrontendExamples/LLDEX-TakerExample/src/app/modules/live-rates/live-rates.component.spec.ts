import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveRatesComponent } from './live-rates.component';

describe('LiveRatesComponent', () => {
  let component: LiveRatesComponent;
  let fixture: ComponentFixture<LiveRatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveRatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LiveRatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
