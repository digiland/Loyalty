import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  LoyaltyProgram, 
  LoyaltyProgramCreate, 
  CustomerMembership,
  Referral,
  ReferralCreate,
  Reward,
  RewardCreate,
  AvailableReward,
  CustomerMembershipWithProgram
} from '../models/loyalty-program.model';
import { Transaction, RedemptionCreate } from '../models/transaction.model';

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

  // Reward management methods
  createReward(reward: RewardCreate): Observable<Reward> {
    return this.http.post<Reward>(`${this.apiUrl}/loyalty-programs/rewards`, reward);
  }

  getProgramRewards(programId: number): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.apiUrl}/loyalty-programs/rewards/${programId}`);
  }

  getCustomerAvailableRewards(phoneNumber: string): Observable<AvailableReward[]> {
    return this.http.get<AvailableReward[]>(`${this.apiUrl}/loyalty-programs/customer/${phoneNumber}/available-rewards`);
  }

  redeemReward(redemption: RedemptionCreate): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/loyalty-programs/redeem`, redemption);
  }

  getCustomerMembershipsForBusiness(phoneNumber: string): Observable<CustomerMembershipWithProgram[]> {
    return this.http.get<CustomerMembershipWithProgram[]>(`${this.apiUrl}/loyalty-programs/customer/${phoneNumber}/memberships`);
  }
}
