import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule } from "@angular/router";
import { createCustomElement } from "@angular/elements";
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
import { SharedBrowserSpinnerModule } from './shared/shared.browser.spinner.module';
import { LoaderComponent } from './shared/components/loader/loader/loader.component';

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
    BrowserAnimationsModule,
    RouterModule.forRoot(APP_ROUTES),
    StepsModule,
    ConfirmDialogModule,
    OverlayPanelModule,
    ToastModule,
    SharedBrowserSpinnerModule
  ],
  providers: [
    ConfirmationService,
    DialogService,
    FormBuilder,
    MessageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { 
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {}
}
