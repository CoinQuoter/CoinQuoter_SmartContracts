import { Component, Inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WEB3PROVIDER } from '../../../../shared/services/provider/provider.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BlockchainService } from '../../../../shared/services/blockchain/blockchain.service';

@Component({
  selector: 'app-rate-info',
  templateUrl: './rate-info.component.html',
  styleUrls: ['./rate-info.component.scss']
})
export class RateInfoComponent implements OnInit {

  @Input() price: number;
  @Input() title: string;
  @Input() redirect: any;

  info = {
    title: 'BUY',
    start: '1.35',
    mid: '25',
    end: '6'
  };

  constructor(private router: Router,
              private blockchainService: BlockchainService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService) { }

  ngOnInit(): void {
  }


  splitNumberToCapitalize(val: number, title: string) {
    let text = val.toString();
    return {
      'title': title,
      'start': text.slice(0,-3),
      'mid': text.slice(-3, -1),
      'end': text.slice(-1)
    };
  }

  getStart() {
    return this.getPrice().slice(0, -3);
  }

  getMid() {
    return this.getPrice().slice(-3,-1);
  }

  getEnd() {
    return this.getPrice().slice(-1);
  }

  getPrice() {
    return parseFloat(String(this.price)).toString();
  }

  redirectToDetails() {
    if(this.blockchainService.isLogged()){
      this.changeRoute();
    }else{
      this.confirmationService.confirm({
        header: "Connection",
        message: "You are not connected with MetaMask. Would you like to log in?",
        accept: () => {
          this.blockchainService.requestAccount().then(()=>{
            this.changeRoute();
          }).catch(() => {
            this.messageService.add({
              severity: "warn",
              summary: "Error",
              detail: "There was a problem with connection. Please try again."
            });
          })
        }
      })
    }
  }

  changeRoute() {
    return this.router.navigate(['/transaction-details'], this.redirect);
  }
}
