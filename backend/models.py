from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class TransactionType(str, enum.Enum):
    EARN = "earn"
    REDEMPTION = "redemption"
    REFERRAL = "referral"
    CASHBACK = "cashback"

class LoyaltyProgramType(str, enum.Enum):
    POINTS = "points"
    TIERED = "tiered"
    PAID = "paid"
    REFERRAL = "referral"
    CASHBACK = "cashback"

class LoyaltyProgram(Base):
    __tablename__ = "loyalty_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    name = Column(String)
    program_type = Column(Enum(LoyaltyProgramType))
    description = Column(Text)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Common parameters for all programs
    earn_rate = Column(Float, default=1.0)  # Points per dollar, referral points, or cashback percentage
    
    # Specific to Tiered Program
    tier_levels = relationship("TierLevel", back_populates="loyalty_program", cascade="all, delete-orphan")
    
    # Specific to Paid Program
    membership_fee = Column(Float, nullable=True)
    membership_period_days = Column(Integer, default=365)
    membership_benefits = Column(Text, nullable=True)
    
    # Rewards for the loyalty program
    rewards = relationship("Reward", back_populates="loyalty_program", cascade="all, delete-orphan")
    
    business = relationship("Business", back_populates="loyalty_programs")
    
class TierLevel(Base):
    __tablename__ = "tier_levels"
    
    id = Column(Integer, primary_key=True, index=True)
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"))
    name = Column(String)
    min_points = Column(Integer)
    benefits = Column(Text)
    multiplier = Column(Float, default=1.0)  # Points multiplier for this tier
    
    loyalty_program = relationship("LoyaltyProgram", back_populates="tier_levels")

class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"))
    name = Column(String)
    description = Column(Text)
    points_required = Column(Integer)
    is_active = Column(Boolean, default=True)
    stock_limit = Column(Integer, nullable=True)  # Optional stock limit
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    loyalty_program = relationship("LoyaltyProgram", back_populates="rewards")

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_person = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    loyalty_rate = Column(Float)  # Legacy field, maintained for backward compatibility
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="business")
    loyalty_programs = relationship("LoyaltyProgram", back_populates="business", cascade="all, delete-orphan")

class CustomerMembership(Base):
    __tablename__ = "customer_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"))
    current_tier_id = Column(Integer, ForeignKey("tier_levels.id"), nullable=True)
    points = Column(Integer, default=0)
    is_paid_member = Column(Boolean, default=False)
    membership_start = Column(DateTime, nullable=True)
    membership_end = Column(DateTime, nullable=True)
    
    customer = relationship("Customer", back_populates="memberships")
    loyalty_program = relationship("LoyaltyProgram")
    current_tier = relationship("TierLevel")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("customers.id"))
    referred_id = Column(Integer, ForeignKey("customers.id"))
    business_id = Column(Integer, ForeignKey("businesses.id"))
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"))
    points_awarded = Column(Integer)
    cashback_awarded = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    referrer = relationship("Customer", foreign_keys=[referrer_id], back_populates="referrals_made")
    referred = relationship("Customer", foreign_keys=[referred_id], back_populates="referrals_received")
    business = relationship("Business")
    
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    total_points = Column(Integer, default=0)  # Legacy field for backward compatibility
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # For tracking referral relationships
    referral_code = Column(String, unique=True, index=True, nullable=True)

    transactions = relationship("Transaction", back_populates="customer")
    memberships = relationship("CustomerMembership", back_populates="customer", cascade="all, delete-orphan")
    referrals_made = relationship("Referral", foreign_keys="[Referral.referrer_id]", back_populates="referrer")
    referrals_received = relationship("Referral", foreign_keys="[Referral.referred_id]", back_populates="referred")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"), nullable=True)
    amount_spent = Column(Float)
    points_earned = Column(Integer)
    cashback_amount = Column(Float, default=0.0)
    transaction_type = Column(Enum(TransactionType), default=TransactionType.EARN)
    reward_description = Column(String, nullable=True)
    tier_id = Column(Integer, ForeignKey("tier_levels.id"), nullable=True)
    referral_id = Column(Integer, ForeignKey("referrals.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    loyalty_program = relationship("LoyaltyProgram")
    tier = relationship("TierLevel")
    referral = relationship("Referral")
