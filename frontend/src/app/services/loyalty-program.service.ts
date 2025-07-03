import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  LoyaltyProgram, 
  LoyaltyProgramCreate, 
  CustomerMembership,
  Referral,
  ReferralCreate
} from '../models/loyalty-program.model';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyProgramService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Loyalty Program CRUD operations
  createLoyaltyProgram(program: LoyaltyProgramCreate): Observable<LoyaltyProgram> {
    return this.http.post<LoyaltyProgram>(`${this.apiUrl}/loyalty-programs`, program);
  }

  getBusinessLoyaltyPrograms(businessId: number): Observable<LoyaltyProgram[]> {
    return this.http.get<LoyaltyProgram[]>(`${this.apiUrl}/loyalty-programs/business/${businessId}`);
  }

  getLoyaltyProgram(programId: number): Observable<LoyaltyProgram> {
    return this.http.get<LoyaltyProgram>(`${this.apiUrl}/loyalty-programs/${programId}`);
  }

  updateLoyaltyProgram(programId: number, program: Partial<LoyaltyProgram>): Observable<LoyaltyProgram> {
    return this.http.put<LoyaltyProgram>(`${this.apiUrl}/loyalty-programs/${programId}`, program);
  }

  deleteLoyaltyProgram(programId: number): Observable<LoyaltyProgram> {
    return this.http.delete<LoyaltyProgram>(`${this.apiUrl}/loyalty-programs/${programId}`);
  }

  // Process a transaction with a specific loyalty program
  processTransaction(transaction: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/loyalty-programs/transaction`, transaction);
  }

  // Process referrals
  processReferral(referral: ReferralCreate): Observable<Referral> {
    return this.http.post<Referral>(`${this.apiUrl}/loyalty-programs/referral`, referral);
  }

  // Enroll customer in a paid membership
  enrollInPaidMembership(programId: number, customerPhoneNumber: string): Observable<CustomerMembership> {
    return this.http.post<CustomerMembership>(
      `${this.apiUrl}/loyalty-programs/paid-membership/${programId}/enroll`,
      {},
      { params: { customer_phone_number: customerPhoneNumber } }
    );
  }

  // Get customer memberships
  getCustomerMemberships(phoneNumber: string): Observable<CustomerMembership[]> {
    return this.http.get<CustomerMembership[]>(`${this.apiUrl}/loyalty-programs/customer/${phoneNumber}/memberships`);
  }
}
