import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerPointsResponse, CustomerSummary } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCustomerPoints(phoneNumber: string): Observable<CustomerPointsResponse> {
    return this.http.get<CustomerPointsResponse>(`${this.apiUrl}/customers/points/${phoneNumber}`);
  }

  getCustomerRecommendations(phoneNumber: string): Observable<{ recommendations: string[] }> {
    return this.http.get<{ recommendations: string[] }>(`${this.apiUrl}/customers/recommendations/${phoneNumber}`);
  }

  getAllCustomers(businessId: number): Observable<CustomerSummary[]> {
    return this.http.get<CustomerSummary[]>(`${this.apiUrl}/reports/all_customers?business_id=${businessId}`);
  }
}
