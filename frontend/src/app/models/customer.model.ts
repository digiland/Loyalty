export interface Customer {
  id: number;
  phone_number: string;
  total_points: number;
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
