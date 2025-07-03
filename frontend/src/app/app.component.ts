import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Business } from './models/business.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Multi-Business Loyalty Platform';
  currentBusiness$: Observable<Business | null>;

  constructor(public authService: AuthService) {
    this.currentBusiness$ = this.authService.currentBusiness$;
  }

  logout() {
    this.authService.logout();
  }
}
