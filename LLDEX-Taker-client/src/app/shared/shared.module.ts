import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsComponent } from './components/steps/steps.component';
import { StepsModule } from 'primeng/steps';
import { ValidationMessagePipe } from './pipes/validation-message.pipe';
import { NoExtensionInstalledDialogComponent } from './components/no-extension-installed-dialog/no-extension-installed-dialog.component';



@NgModule({
  declarations: [
    StepsComponent,
    ValidationMessagePipe,
    NoExtensionInstalledDialogComponent
  ],
    exports: [
        StepsComponent,
        ValidationMessagePipe
    ],
  imports: [
    CommonModule,
    StepsModule
  ]
})
export class SharedModule { }
