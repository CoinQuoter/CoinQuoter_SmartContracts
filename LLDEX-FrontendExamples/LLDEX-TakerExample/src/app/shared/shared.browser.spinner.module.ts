import { Injector, NgModule } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoaderComponent } from './components/loader/loader/loader.component';
import { createCustomElement } from "@angular/elements";

@NgModule({
  declarations: [
    LoaderComponent
  ],
  imports: [
    ProgressSpinnerModule
  ],
})
export class SharedBrowserSpinnerModule { 
    constructor(private injector: Injector) {
    if (!customElements.get('spinner-circular')) {
      const element = createCustomElement(LoaderComponent, {
        injector: this.injector
      });

      customElements.define('spinner-circular', element);
    }
  }
}
