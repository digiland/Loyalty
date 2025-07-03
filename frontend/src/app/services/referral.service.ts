import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerReferralInfo, RecommendationResponse } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Get customer's referral code
  getCustomerReferralCode(phoneNumber: string): Observable<CustomerReferralInfo> {
    return this.http.get<CustomerReferralInfo>(`${this.apiUrl}/customers/${phoneNumber}/referral-code`);
  }

  // Find customer by referral code
  getCustomerByReferralCode(referralCode: string): Observable<CustomerReferralInfo> {
    return this.http.get<CustomerReferralInfo>(`${this.apiUrl}/referral-codes/${referralCode}/customer`);
  }

  // Process transaction with referral code
  processTransactionWithReferral(
    businessId: number,
    customerPhoneNumber: string,
    amountSpent: number,
    referralCode: string,
    loyaltyProgramId?: number
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transactions/with-referral`, null, {
      params: {
        business_id: businessId,
        customer_phone_number: customerPhoneNumber,
        amount_spent: amountSpent,
        referral_code: referralCode,
        loyalty_program_id: loyaltyProgramId || ''
      }
    });
  }

  // Get enhanced recommendations
  getEnhancedRecommendations(phoneNumber: string, businessId?: number): Observable<RecommendationResponse> {
    const params: any = {};
    if (businessId) {
      params.business_id = businessId;
    }
    return this.http.get<RecommendationResponse>(`${this.apiUrl}/customers/recommendations/${phoneNumber}`, { params });
  }

  // Get referral performance analytics
  getReferralAnalytics(businessId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/referral_performance`, { params: { business_id: businessId } });
  }

  // Original methods (maintained for backward compatibility)
  trackReferral(businessId: number, newCustomerPhone: string, referrerPhone?: string) {
    return this.http.post<any>(`${this.apiUrl}/referrals/track`, null, {
      params: {
        business_id: businessId,
        new_customer_phone_number: newCustomerPhone,
        referrer_phone_number: referrerPhone || ''
      }
    });
  }

  completeReferral(referralId: number, pointsToAward: number) {
    return this.http.post<any>(`${this.apiUrl}/referrals/complete`, null, {
      params: {
        referral_id: referralId,
        points_to_award_referrer: pointsToAward
      }
    });
  }

  getAllReferrals(businessId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/referrals/all`, { params: { business_id: businessId } });
  }
}
