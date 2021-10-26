import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllowanceDialogComponent } from './allowance-dialog.component';

describe('AllowanceDialogComponent', () => {
  let component: AllowanceDialogComponent;
  let fixture: ComponentFixture<AllowanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllowanceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllowanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
