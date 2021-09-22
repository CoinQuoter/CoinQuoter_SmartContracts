import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StepsComponent implements OnInit {

  @Input() activeIndex: number;

  items: MenuItem[];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.items = [
      { label: 'LIVE RATES', command: () => this.router.navigate(["/"]), disabled: true },
      { label: 'TRANSACTION DETAILS', command: () => this.router.navigate(["/transaction-details"]), disabled: true },
      { label: 'TRADE', disabled: true },
      { label: 'TRANSACTION STATUS', disabled: true }
    ]
    this.items.map((element, index) =>
      index < this.activeIndex ? this.items[index].disabled = false : this.items[index])
  }

}
