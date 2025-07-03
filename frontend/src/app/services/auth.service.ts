import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthToken } from '../models/auth.model';
import { Business, BusinessCreate } from '../models/business.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentBusinessSubject = new BehaviorSubject<Business | null>(null);
  public currentBusiness$ = this.currentBusinessSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in
    this.loadCurrentBusiness();
  }

  register(businessData: BusinessCreate): Observable<Business> {
    return this.http.post<Business>(`${this.apiUrl}/register_business`, businessData);
  }

  login(email: string, password: string): Observable<AuthToken> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return this.http.post<AuthToken>(`${this.apiUrl}/login_business`, formData).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem('token', response.access_token);
          this.loadCurrentBusiness();
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentBusinessSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentBusiness(): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/me`);
  }

  private loadCurrentBusiness(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.getCurrentBusiness().subscribe({
        next: business => this.currentBusinessSubject.next(business),
        error: () => {
          // Handle invalid token
          localStorage.removeItem('token');
          this.currentBusinessSubject.next(null);
        }
      });
    }
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  get currentBusinessValue(): Business | null {
    return this.currentBusinessSubject.value;
  }
}
