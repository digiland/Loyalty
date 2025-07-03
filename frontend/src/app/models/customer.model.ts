export interface Customer {
  id: number;
  phone_number: string;
  total_points: number;
  referral_code?: string;
  created_at: string;
  transactions?: any[];
}

export interface CustomerPointsResponse {
  total_points: number;
  recent_transactions: CustomerTransaction[];
}

export interface CustomerTransaction {
  business_name: string;
  points_earned: number;
  amount_spent: number;
  transaction_type?: string;
  reward_description?: string;
  timestamp: string;
}

export interface CustomerSummary {
  phone_number: string;
  points: number;
}

export interface CustomerReferralInfo {
  phone_number: string;
  referral_code: string;
  total_points: number;
}

export interface RecommendationResponse {
  recommendations: string[];
  customer_stats: {
    total_transactions: number;
    total_spent: number;
    total_points: number;
    days_since_last_visit: number;
    referral_code: string;
  };
}
