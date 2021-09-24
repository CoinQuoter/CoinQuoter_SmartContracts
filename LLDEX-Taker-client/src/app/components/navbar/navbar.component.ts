import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../shared/services/session/session.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  session: boolean;
  timeLeft: number;
  address: string;
  sessionPublicKey: string;
  expirationTimeStamp: string;

  constructor(private sessionService: SessionService) { }

  ngOnInit(): void {
    this.session = this.sessionService.isSession();
    if(this.session) {
      this.timeLeft = this.sessionService.getTimeLeft();
      let timer = setInterval(() => {
        this.timeLeft -= 1000;
        if( this.timeLeft <= 0 ) {
          this.sessionService.clearStorage();
          this.session = false;
          window.location.reload();
          clearInterval(timer);
        }
      }, 1000);

      const session = this.sessionService.getSessionDetails();
      this.address = session.session_creator;
      this.sessionPublicKey = session.session_public_key;
      this.expirationTimeStamp = this.sessionService.getExpirationTimeStamp();
    }
  }

  getCountdown(): string {
    const days = Math.floor(this.timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((this.timeLeft % (1000 * 60 * 60 * 24)) / (1000*60*60));
    const minutes = Math.floor((this.timeLeft % (1000 * 60 * 60 * 24))/(1000*60));
    const seconds = Math.floor((this.timeLeft % (1000 * 60)) / 1000);
    return  (days === 0 ? '' :  `${days}d `) +
            (hours === 0 ? '' :  `${hours}h `) +
            (minutes === 0 ? '' :  `${minutes}m `) +
            (seconds === 0 ? '' :  `${seconds}s`);
  }

  endSession() {
    this.sessionService.endSession().then(() => window.location.reload());
  }

}
