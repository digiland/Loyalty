import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction, TransactionCreate, RedemptionCreate, CustomerPointsResponse, ReferralTransactionCreate } from '../models/transaction.model';
import { LoyaltyProgram } from '../models/loyalty-program.model';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Legacy methods
  addPoints(transaction: TransactionCreate): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions/add_points`, transaction);
  }

  redeemPoints(redemption: RedemptionCreate): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions/redeem_points`, redemption);
  }

  // New methods that support both legacy and new loyalty programs
  addPointsWithProgram(transaction: TransactionCreate): Observable<Transaction> {
    if (transaction.loyalty_program_id) {
      return this.http.post<Transaction>(`${this.apiUrl}/loyalty-programs/transaction`, transaction);
    } else {
      return this.addPoints(transaction);
    }
  }

  redeemPointsWithProgram(redemption: RedemptionCreate): Observable<Transaction> {
    if (redemption.loyalty_program_id) {
      // Customize this endpoint based on your backend implementation
      return this.http.post<Transaction>(`${this.apiUrl}/loyalty-programs/redeem`, redemption);
    } else {
      return this.redeemPoints(redemption);
    }
  }

  getCustomerPoints(businessId: number, phoneNumber: string): Observable<CustomerPointsResponse> {
    return this.http.get<CustomerPointsResponse>(
      `${this.apiUrl}/transactions/customer_points`,
      { params: { business_id: businessId.toString(), phone_number: phoneNumber } }
    );
  }

  // Utility method to get all active loyalty programs for a business
  getActiveLoyaltyPrograms(businessId: number): Observable<LoyaltyProgram[]> {
    return this.http.get<LoyaltyProgram[]>(`${this.apiUrl}/loyalty-programs/business/${businessId}`);
  }

  // Process a referral transaction
  processReferralTransaction(referralTransaction: ReferralTransactionCreate): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/loyalty-programs/transaction/referral`, referralTransaction);
  }
}
