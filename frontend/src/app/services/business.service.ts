import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Business } from '../models/business.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  setLoyaltyRate(businessId: number, loyaltyRate: number): Observable<Business> {
    return this.http.post<Business>(`${this.apiUrl}/businesses/${businessId}/loyalty_rules?loyalty_rate=${loyaltyRate}`, {});
  }
}
