export enum LoyaltyProgramType {
  POINTS = 'points',
  TIERED = 'tiered',
  PAID = 'paid',
  REFERRAL = 'referral',
  CASHBACK = 'cashback'
}

export interface TierLevel {
  id?: number;
  loyalty_program_id?: number;
  name: string;
  min_points: number;
  benefits: string;
  multiplier: number;
}

export interface LoyaltyProgramBase {
  name: string;
  program_type: LoyaltyProgramType;
  description: string;
  earn_rate: number;
  active?: boolean;
}

export interface PointsProgramCreate extends LoyaltyProgramBase {
  program_type: LoyaltyProgramType.POINTS;
}

export interface TieredProgramCreate extends LoyaltyProgramBase {
  program_type: LoyaltyProgramType.TIERED;
  tier_levels: TierLevel[];
}

export interface PaidProgramCreate extends LoyaltyProgramBase {
  program_type: LoyaltyProgramType.PAID;
  membership_fee: number;
  membership_period_days?: number;
  membership_benefits: string;
}

export interface ReferralProgramCreate extends LoyaltyProgramBase {
  program_type: LoyaltyProgramType.REFERRAL;
}

export interface CashbackProgramCreate extends LoyaltyProgramBase {
  program_type: LoyaltyProgramType.CASHBACK;
}

export type ProgramData = PointsProgramCreate | TieredProgramCreate | PaidProgramCreate | ReferralProgramCreate | CashbackProgramCreate;

export interface LoyaltyProgramCreate {
  program_data: ProgramData;
  business_id: number;
}

export interface LoyaltyProgram extends LoyaltyProgramBase {
  id: number;
  business_id: number;
  created_at: string;
  tier_levels?: TierLevel[];
  membership_fee?: number;
  membership_period_days?: number;
  membership_benefits?: string;
}

export interface CustomerMembership {
  id: number;
  customer_id: number;
  loyalty_program_id: number;
  points: number;
  is_paid_member: boolean;
  current_tier_id?: number;
  membership_start?: string;
  membership_end?: string;
  current_tier?: TierLevel;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  business_id: number;
  loyalty_program_id: number;
  points_awarded: number;
  cashback_awarded: number;
  created_at: string;
}

export interface ReferralCreate {
  business_id: number;
  loyalty_program_id: number;
  referrer_phone_number: string;
  referred_phone_number: string;
}
