import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsComponent } from './components/steps/steps.component';
import { StepsModule } from 'primeng/steps';



@NgModule({
  declarations: [
    StepsComponent
  ],
  exports: [
    StepsComponent
  ],
  imports: [
    CommonModule,
    StepsModule
  ]
})
export class SharedModule { }
