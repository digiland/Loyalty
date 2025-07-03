from sqlalchemy.orm import Session
import models, schemas, crud
from typing import Union
import datetime
import uuid
import string
import random

# Helper to generate referral code
def generate_referral_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# Create loyalty program based on type
def create_loyalty_program(db: Session, program_create: schemas.LoyaltyProgramCreate):
    program_data = program_create.program_data
    
    # Create base loyalty program
    db_program = models.LoyaltyProgram(
        business_id=program_create.business_id,
        name=program_data.name,
        program_type=program_data.program_type,
        description=program_data.description,
        earn_rate=program_data.earn_rate,
        active=program_data.active
    )
    
    # Add type-specific attributes
    if program_data.program_type == models.LoyaltyProgramType.TIERED and hasattr(program_data, 'tier_levels'):
        db.add(db_program)
        db.flush()  # Need to flush to get the program ID
        
        # Create tier levels
        for tier_data in program_data.tier_levels:
            db_tier = models.TierLevel(
                loyalty_program_id=db_program.id,
                name=tier_data.name,
                min_points=tier_data.min_points,
                benefits=tier_data.benefits,
                multiplier=tier_data.multiplier
            )
            db.add(db_tier)
            
    elif program_data.program_type == models.LoyaltyProgramType.PAID:
        db_program.membership_fee = program_data.membership_fee
        db_program.membership_period_days = program_data.membership_period_days
        db_program.membership_benefits = program_data.membership_benefits
    
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program

# Get a loyalty program by ID
def get_loyalty_program(db: Session, program_id: int):
    return db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == program_id).first()

# Get all loyalty programs for a business
def get_business_loyalty_programs(db: Session, business_id: int):
    return db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.business_id == business_id).all()

# Update a loyalty program
def update_loyalty_program(db: Session, program_id: int, program_update: schemas.LoyaltyProgramBase):
    db_program = db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == program_id).first()
    if not db_program:
        return None
    
    # Update the program attributes
    for key, value in program_update.dict(exclude_unset=True).items():
        setattr(db_program, key, value)
    
    db.commit()
    db.refresh(db_program)
    return db_program

# Delete a loyalty program
def delete_loyalty_program(db: Session, program_id: int):
    db_program = db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == program_id).first()
    if not db_program:
        return None
    
    db.delete(db_program)
    db.commit()
    return db_program

# Add a customer to a loyalty program
def add_customer_to_program(db: Session, customer_id: int, program_id: int):
    # Check if membership already exists
    existing = db.query(models.CustomerMembership).filter(
        models.CustomerMembership.customer_id == customer_id,
        models.CustomerMembership.loyalty_program_id == program_id
    ).first()
    
    if existing:
        return existing
    
    # Create new membership
    membership = models.CustomerMembership(
        customer_id=customer_id,
        loyalty_program_id=program_id,
        points=0
    )
    
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

# Enroll customer in paid membership
def enroll_in_paid_membership(db: Session, customer_id: int, program_id: int):
    program = db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == program_id).first()
    if not program or program.program_type != models.LoyaltyProgramType.PAID:
        return None
    
    # Get or create membership
    membership = db.query(models.CustomerMembership).filter(
        models.CustomerMembership.customer_id == customer_id,
        models.CustomerMembership.loyalty_program_id == program_id
    ).first()
    
    if not membership:
        membership = models.CustomerMembership(
            customer_id=customer_id,
            loyalty_program_id=program_id,
            points=0
        )
        db.add(membership)
    
    # Set membership dates
    now = datetime.datetime.utcnow()
    membership.is_paid_member = True
    membership.membership_start = now
    membership.membership_end = now + datetime.timedelta(days=program.membership_period_days)
    
    db.commit()
    db.refresh(membership)
    return membership

# Calculate tier for a customer
def calculate_customer_tier(db: Session, customer_id: int, program_id: int):
    # Get the customer's points in this program
    membership = db.query(models.CustomerMembership).filter(
        models.CustomerMembership.customer_id == customer_id,
        models.CustomerMembership.loyalty_program_id == program_id
    ).first()
    
    if not membership:
        return None
    
    # Get program tiers sorted by min_points descending
    tiers = db.query(models.TierLevel).filter(
        models.TierLevel.loyalty_program_id == program_id
    ).order_by(models.TierLevel.min_points.desc()).all()
    
    # Find the highest tier the customer qualifies for
    current_tier = None
    for tier in tiers:
        if membership.points >= tier.min_points:
            current_tier = tier
            break
    
    if current_tier:
        membership.current_tier_id = current_tier.id
        db.commit()
    
    return current_tier

# Process a referral
def process_referral(db: Session, referral: schemas.ReferralCreate):
    # Get the referrer and referred customers
    referrer = db.query(models.Customer).filter(models.Customer.phone_number == referral.referrer_phone_number).first()
    referred = db.query(models.Customer).filter(models.Customer.phone_number == referral.referred_phone_number).first()
    
    if not referrer or not referred or referrer.id == referred.id:
        return None
    
    # Get the loyalty program
    program = db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == referral.loyalty_program_id).first()
    if not program or program.program_type != models.LoyaltyProgramType.REFERRAL:
        return None
    
    # Create referral record
    db_referral = models.Referral(
        referrer_id=referrer.id,
        referred_id=referred.id,
        business_id=referral.business_id,
        loyalty_program_id=referral.loyalty_program_id,
        points_awarded=int(program.earn_rate),  # Points awarded based on earn rate
        cashback_awarded=0.0
    )
    db.add(db_referral)
    
    # Add points to referrer's membership
    membership = db.query(models.CustomerMembership).filter(
        models.CustomerMembership.customer_id == referrer.id,
        models.CustomerMembership.loyalty_program_id == program.id
    ).first()
    
    if not membership:
        membership = models.CustomerMembership(
            customer_id=referrer.id,
            loyalty_program_id=program.id,
            points=0
        )
        db.add(membership)
    
    membership.points += db_referral.points_awarded
    
    # Ensure the referred customer has a referral code
    if not referred.referral_code:
        referred.referral_code = generate_referral_code()
    
    db.commit()
    db.refresh(db_referral)
    return db_referral

# Process a transaction with the new loyalty program system
def process_transaction(db: Session, transaction: schemas.TransactionCreate):
    # Get the business and customer
    business = db.query(models.Business).filter(models.Business.id == transaction.business_id).first()
    if not business:
        raise Exception("Business not found")
    
    customer = db.query(models.Customer).filter(models.Customer.phone_number == transaction.customer_phone_number).first()
    if not customer:
        customer = models.Customer(phone_number=transaction.customer_phone_number, total_points=0, referral_code=generate_referral_code())
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # Default to legacy loyalty calculation if no program specified
    if not transaction.loyalty_program_id:
        points_earned = int(transaction.amount_spent * business.loyalty_rate)
        customer.total_points += points_earned
        
        db_transaction = models.Transaction(
            business_id=business.id,
            customer_id=customer.id,
            amount_spent=transaction.amount_spent,
            points_earned=points_earned
        )
        db.add(db_transaction)
        db.commit()
        return db_transaction
    
    # Process with specific loyalty program
    program = db.query(models.LoyaltyProgram).filter(models.LoyaltyProgram.id == transaction.loyalty_program_id).first()
    if not program:
        raise Exception("Loyalty program not found")
    
    # Get or create customer membership for this program
    membership = db.query(models.CustomerMembership).filter(
        models.CustomerMembership.customer_id == customer.id,
        models.CustomerMembership.loyalty_program_id == program.id
    ).first()
    
    if not membership:
        membership = models.CustomerMembership(
            customer_id=customer.id,
            loyalty_program_id=program.id,
            points=0
        )
        db.add(membership)
        db.flush()
    
    # Calculate rewards based on program type
    points_earned = 0
    cashback_amount = 0.0
    tier_id = None
    
    if program.program_type == models.LoyaltyProgramType.POINTS:
        points_earned = int(transaction.amount_spent * program.earn_rate)
        membership.points += points_earned
    
    elif program.program_type == models.LoyaltyProgramType.TIERED:
        # Calculate the tier first
        tier = calculate_customer_tier(db, customer.id, program.id)
        
        # Calculate points with tier multiplier if applicable
        base_points = int(transaction.amount_spent * program.earn_rate)
        if tier:
            points_earned = int(base_points * tier.multiplier)
            tier_id = tier.id
        else:
            points_earned = base_points
        
        membership.points += points_earned
        # Recalculate tier after adding points
        calculate_customer_tier(db, customer.id, program.id)
    
    elif program.program_type == models.LoyaltyProgramType.PAID:
        # Check if customer has active paid membership
        if membership.is_paid_member and membership.membership_end and membership.membership_end > datetime.datetime.utcnow():
            # Paid members get the full earn rate
            points_earned = int(transaction.amount_spent * program.earn_rate)
        else:
            # Non-paid members get half the earn rate
            points_earned = int(transaction.amount_spent * program.earn_rate * 0.5)
        
        membership.points += points_earned
    
    elif program.program_type == models.LoyaltyProgramType.CASHBACK:
        # Calculate cashback amount
        cashback_percentage = program.earn_rate
        cashback_amount = transaction.amount_spent * (cashback_percentage / 100)
        
    # For backward compatibility, also update total points
    customer.total_points += points_earned
    
    # Create transaction record
    db_transaction = models.Transaction(
        business_id=business.id,
        customer_id=customer.id,
        loyalty_program_id=program.id,
        amount_spent=transaction.amount_spent,
        points_earned=points_earned,
        cashback_amount=cashback_amount,
        tier_id=tier_id,
        transaction_type=models.TransactionType.EARN
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# Reward management functions
def create_reward(db: Session, reward: schemas.RewardCreate):
    db_reward = models.Reward(
        loyalty_program_id=reward.loyalty_program_id,
        name=reward.name,
        description=reward.description,
        points_required=reward.points_required,
        is_active=reward.is_active,
        stock_limit=reward.stock_limit
    )
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

def get_rewards_by_program(db: Session, program_id: int):
    return db.query(models.Reward).filter(
        models.Reward.loyalty_program_id == program_id,
        models.Reward.is_active == True
    ).all()

def get_available_rewards_for_customer(db: Session, phone_number: str, business_id: int):
    # Get customer
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        return []
    
    # Get customer memberships for this business
    memberships = db.query(models.CustomerMembership).join(
        models.LoyaltyProgram,
        models.CustomerMembership.loyalty_program_id == models.LoyaltyProgram.id
    ).filter(
        models.CustomerMembership.customer_id == customer.id,
        models.LoyaltyProgram.business_id == business_id
    ).all()
    
    available_rewards = []
    for membership in memberships:
        # Get rewards for this program that the customer can afford
        rewards = db.query(models.Reward).filter(
            models.Reward.loyalty_program_id == membership.loyalty_program_id,
            models.Reward.is_active == True,
            models.Reward.points_required <= membership.points
        ).all()
        
        for reward in rewards:
            available_rewards.append({
                'reward': reward,
                'membership': membership,
                'customer_points': membership.points
            })
    
    return available_rewards

def redeem_reward(db: Session, redemption: schemas.RedemptionCreate):
    # Find customer
    customer = db.query(models.Customer).filter(models.Customer.phone_number == redemption.customer_phone_number).first()
    if not customer:
        raise Exception("Customer not found")
    
    # If loyalty program is specified, handle program-specific redemption
    if redemption.loyalty_program_id:
        # Get customer membership
        membership = db.query(models.CustomerMembership).filter(
            models.CustomerMembership.customer_id == customer.id,
            models.CustomerMembership.loyalty_program_id == redemption.loyalty_program_id
        ).first()
        
        if not membership:
            raise Exception("Customer is not a member of this loyalty program")
        
        # Check if customer has enough points in this program
        if membership.points < redemption.points_to_redeem:
            raise Exception(f"Not enough points in this program. Customer has {membership.points} points, but {redemption.points_to_redeem} were requested.")
        
        # Deduct points from program membership
        membership.points -= redemption.points_to_redeem
        
        # Also deduct from total points for backward compatibility
        customer.total_points -= redemption.points_to_redeem
        
        # Create transaction
        db_transaction = models.Transaction(
            business_id=redemption.business_id,
            customer_id=customer.id,
            loyalty_program_id=redemption.loyalty_program_id,
            amount_spent=0,
            points_earned=-redemption.points_to_redeem,
            transaction_type=models.TransactionType.REDEMPTION,
            reward_description=redemption.reward_description
        )
        
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    
    # Legacy redemption (no specific program)
    else:
        # Use the existing legacy redemption logic
        return crud.redeem_points(db, redemption)

def get_customer_memberships_for_business(db: Session, phone_number: str, business_id: int):
    # Find customer
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        return []
    
    # Get memberships for this business
    memberships = db.query(models.CustomerMembership).join(
        models.LoyaltyProgram,
        models.CustomerMembership.loyalty_program_id == models.LoyaltyProgram.id
    ).filter(
        models.CustomerMembership.customer_id == customer.id,
        models.LoyaltyProgram.business_id == business_id
    ).all()
    
    return memberships
