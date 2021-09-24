import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BaseDataService<T> {

  data: T;

  constructor() { }

  setData(data: T) {
    this.data = data;
  }

  isDataSet(): boolean {
    return !!this.data;
  }

  getData(): T {
    return this.data;
  }
}
