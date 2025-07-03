import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RevenueStats {
  total_revenue: number;
  average_transaction: number;
  monthly_revenue: { month: string; revenue: number }[];
}

export interface CustomerInsights {
  new_customers_this_month: number;
  repeat_customers: number;
  high_value_customers: number;
  active_customers_this_month: number;
}

export interface LoyaltyPerformance {
  total_points_issued: number;
  total_points_redeemed: number;
  outstanding_points: number;
  redemption_rate: number;
  avg_points_per_transaction: number;
  loyalty_adoption_rate: number;
}

export interface BusinessHealth {
  transactions_this_month: number;
  transactions_last_month: number;
  growth_rate: number;
  avg_customer_lifetime_value: number;
  peak_hours: { hour: number; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Basic reporting
  getTotalPointsIssued(businessId: number, loyaltyProgramId?: number) {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<{ total_points_issued: number }>(`${this.apiUrl}/reports/total_points_issued`, { params });
  }
  getTotalRedemptions(businessId: number, loyaltyProgramId?: number) {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<{ total_redemptions: number }>(`${this.apiUrl}/reports/total_redemptions`, { params });
  }
  getCustomerCount(businessId: number, loyaltyProgramId?: number) {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<{ customer_count: number }>(`${this.apiUrl}/reports/customer_count`, { params });
  }
  getTopCustomers(businessId: number, n: number = 5, loyaltyProgramId?: number) {
    const params: any = { business_id: businessId, n };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<{ phone_number: string, points: number }[]>(`${this.apiUrl}/reports/top_customers`, { params });
  }
  getAllCustomers(businessId: number, loyaltyProgramId?: number) {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<{ phone_number: string, points: number }[]>(`${this.apiUrl}/reports/all_customers`, { params });
  }

  // Enhanced analytics
  getRevenueStats(businessId: number, loyaltyProgramId?: number): Observable<RevenueStats> {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<RevenueStats>(`${this.apiUrl}/analytics/revenue_stats`, { params });
  }
  getCustomerInsights(businessId: number, loyaltyProgramId?: number): Observable<CustomerInsights> {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<CustomerInsights>(`${this.apiUrl}/analytics/customer_insights`, { params });
  }
  getLoyaltyPerformance(businessId: number, loyaltyProgramId?: number): Observable<LoyaltyPerformance> {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<LoyaltyPerformance>(`${this.apiUrl}/analytics/loyalty_performance`, { params });
  }
  getBusinessHealth(businessId: number, loyaltyProgramId?: number): Observable<BusinessHealth> {
    const params: any = { business_id: businessId };
    if (loyaltyProgramId) {
      params.loyalty_program_id = loyaltyProgramId;
    }
    return this.http.get<BusinessHealth>(`${this.apiUrl}/analytics/business_health`, { params });
  }
}
