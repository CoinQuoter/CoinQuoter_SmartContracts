import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsComponent } from './components/steps/steps.component';
import { StepsModule } from 'primeng/steps';
import { ValidationMessagePipe } from './pipes/validation-message.pipe';



@NgModule({
  declarations: [
    StepsComponent,
    ValidationMessagePipe
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
