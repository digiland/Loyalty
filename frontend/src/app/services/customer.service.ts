import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerPointsResponse } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCustomerPoints(phoneNumber: string): Observable<CustomerPointsResponse> {
    return this.http.get<CustomerPointsResponse>(`${this.apiUrl}/customers/points/${phoneNumber}`);
  }
}
