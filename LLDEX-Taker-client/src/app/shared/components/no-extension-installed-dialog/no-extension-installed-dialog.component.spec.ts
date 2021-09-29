import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoExtensionInstalledDialogComponent } from './no-extension-installed-dialog.component';

describe('NoExtensionInstalledDialogComponent', () => {
  let component: NoExtensionInstalledDialogComponent;
  let fixture: ComponentFixture<NoExtensionInstalledDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoExtensionInstalledDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoExtensionInstalledDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
