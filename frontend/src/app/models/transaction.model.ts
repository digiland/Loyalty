export enum TransactionType {
  EARN = 'earn',
  REDEMPTION = 'redemption',
  REFERRAL = 'referral',
  CASHBACK = 'cashback'
}

export interface Transaction {
  id: number;
  business_id: number;
  customer_id: number;
  loyalty_program_id?: number;
  amount_spent: number;
  points_earned: number;
  cashback_amount?: number;
  transaction_type?: TransactionType;
  reward_description?: string;
  tier_id?: number;
  referral_id?: number;
  timestamp: string;
}

export interface TransactionCreate {
  business_id: number;
  customer_phone_number: string;
  amount_spent: number;
  loyalty_program_id?: number;
}

export interface RedemptionCreate {
  business_id: number;
  customer_phone_number: string;
  points_to_redeem: number;
  reward_description: string;
  loyalty_program_id?: number;
}

export interface ReferralTransactionCreate {
  business_id: number;
  referral_code: string;
  customer_phone_number: string;
  loyalty_program_id: number;
}

export interface CustomerPointsResponse {
  total_points: number;
  memberships: any[];
  recent_transactions: Transaction[];
}
