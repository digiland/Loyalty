from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Union
from datetime import datetime
import models
from models import TransactionType, LoyaltyProgramType

# Schemas for Transaction
class TransactionBase(BaseModel):
    amount_spent: float
    points_earned: int

class TransactionCreate(BaseModel):
    business_id: int
    customer_phone_number: str
    amount_spent: float
    loyalty_program_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    business_id: int
    customer_id: int
    loyalty_program_id: Optional[int] = None
    transaction_type: TransactionType = TransactionType.EARN
    reward_description: Optional[str] = None
    cashback_amount: Optional[float] = None
    timestamp: datetime

    class Config:
        orm_mode = True

# Redemption schema
class RedemptionCreate(BaseModel):
    business_id: int
    customer_phone_number: str
    points_to_redeem: int
    reward_description: str
    loyalty_program_id: Optional[int] = None

# Reward schemas
class RewardBase(BaseModel):
    name: str
    description: str
    points_required: int
    is_active: bool = True
    stock_limit: Optional[int] = None

class RewardCreate(RewardBase):
    loyalty_program_id: int

class Reward(RewardBase):
    id: int
    loyalty_program_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Schemas for Customer
class CustomerBase(BaseModel):
    phone_number: str

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    total_points: int
    created_at: datetime
    transactions: List[Transaction] = []

    class Config:
        orm_mode = True

# Schemas for Business
class BusinessBase(BaseModel):
    email: str
    name: str
    contact_person: Optional[str] = None

class BusinessCreate(BusinessBase):
    password: str
    loyalty_rate: Optional[float] = 1.0

class Business(BusinessBase):
    id: int
    loyalty_rate: float
    created_at: datetime

    class Config:
        orm_mode = True

# Tier Level Schema
class TierLevelBase(BaseModel):
    name: str
    min_points: int
    benefits: str
    multiplier: float = 1.0

class TierLevelCreate(TierLevelBase):
    pass

class TierLevel(TierLevelBase):
    id: int
    loyalty_program_id: int

    class Config:
        orm_mode = True

# Loyalty Program Schemas
class LoyaltyProgramBase(BaseModel):
    name: str
    program_type: LoyaltyProgramType
    description: str
    earn_rate: float = 1.0
    active: bool = True

class PointsProgramCreate(LoyaltyProgramBase):
    program_type: LoyaltyProgramType = LoyaltyProgramType.POINTS

class TieredProgramCreate(LoyaltyProgramBase):
    program_type: LoyaltyProgramType = LoyaltyProgramType.TIERED
    tier_levels: List[TierLevelCreate]

class PaidProgramCreate(LoyaltyProgramBase):
    program_type: LoyaltyProgramType = LoyaltyProgramType.PAID
    membership_fee: float
    membership_period_days: int = 365
    membership_benefits: str

class ReferralProgramCreate(LoyaltyProgramBase):
    program_type: LoyaltyProgramType = LoyaltyProgramType.REFERRAL
    
class CashbackProgramCreate(LoyaltyProgramBase):
    program_type: LoyaltyProgramType = LoyaltyProgramType.CASHBACK

# Combined create schema that accepts any program type
class LoyaltyProgramCreate(BaseModel):
    program_data: Union[
        PointsProgramCreate, 
        TieredProgramCreate, 
        PaidProgramCreate, 
        ReferralProgramCreate, 
        CashbackProgramCreate
    ]
    business_id: int

class LoyaltyProgram(LoyaltyProgramBase):
    id: int
    business_id: int
    created_at: datetime
    tier_levels: Optional[List[TierLevel]] = []
    membership_fee: Optional[float] = None
    membership_period_days: Optional[int] = None
    membership_benefits: Optional[str] = None
    rewards: Optional[List[Reward]] = []

    class Config:
        orm_mode = True

# Customer Membership
class CustomerMembershipBase(BaseModel):
    loyalty_program_id: int
    points: int = 0
    is_paid_member: bool = False

class CustomerMembershipCreate(CustomerMembershipBase):
    customer_id: int

class CustomerMembership(CustomerMembershipBase):
    id: int
    customer_id: int
    current_tier_id: Optional[int] = None
    membership_start: Optional[datetime] = None
    membership_end: Optional[datetime] = None
    current_tier: Optional[TierLevel] = None

    class Config:
        orm_mode = True

# Referral Schema
class ReferralBase(BaseModel):
    business_id: int
    loyalty_program_id: int

class ReferralCreate(ReferralBase):
    referrer_phone_number: str
    referred_phone_number: str

class Referral(ReferralBase):
    id: int
    referrer_id: int
    referred_id: int
    points_awarded: int
    cashback_awarded: float
    created_at: datetime

    class Config:
        orm_mode = True

# Schemas for Authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CustomerPointsResponse(BaseModel):
    total_points: int
    memberships: List[CustomerMembership] = []
    recent_transactions: list

    class Config:
        orm_mode = True

# Enhanced Transaction schemas for the new loyalty program types
class TransactionCreate(BaseModel):
    business_id: int
    customer_phone_number: str
    amount_spent: float
    loyalty_program_id: Optional[int] = None

class ReferralTransactionCreate(BaseModel):
    business_id: int
    referral_code: str
    customer_phone_number: str
    loyalty_program_id: int
