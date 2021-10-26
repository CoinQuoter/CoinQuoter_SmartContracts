import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSessionDialogComponent } from './create-session-dialog.component';

describe('CreateSessionDialogComponent', () => {
  let component: CreateSessionDialogComponent;
  let fixture: ComponentFixture<CreateSessionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateSessionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSessionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
