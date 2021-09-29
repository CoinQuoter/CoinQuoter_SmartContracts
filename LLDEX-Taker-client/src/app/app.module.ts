import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from "@angular/router";
import { APP_ROUTES } from "./app.routing";
import { NavbarComponent } from './components/navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StepsModule } from 'primeng/steps';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DialogService } from 'primeng/dynamicdialog';
import { FormBuilder } from '@angular/forms';
import { ToastModule } from 'primeng/toast';

export function enableWeb3Provider(provider) {
  return () => {
    provider.enable;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(APP_ROUTES),
    StepsModule,
    ConfirmDialogModule,
    OverlayPanelModule,
    ToastModule
  ],
  providers: [
    ConfirmationService,
    DialogService,
    FormBuilder,
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
