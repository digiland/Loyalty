#!/usr/bin/env python3
"""
Script to populate the loyalty database with Econet telecom demo data.
This creates a comprehensive demo environment with realistic telecom data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from crud_loyalty_programs import generate_referral_code
import datetime
from typing import List
import random

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass

def create_econet_business(db: Session):
    """Create Econet telecom business"""
    # Check if Econet already exists
    existing_business = db.query(models.Business).filter(models.Business.email == "econet@econet.com").first()
    if existing_business:
        print("Econet business already exists, skipping creation")
        return existing_business
    
    business = models.Business(
        name="Econet Telecom",
        contact_person="John Mukamuri",
        email="econet@econet.com",
        password_hash=get_password_hash("Password123"),
        loyalty_rate=0.02,  # 2% points rate for legacy compatibility
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    print(f"Created Econet business with ID: {business.id}")
    return business

def create_loyalty_programs(db: Session, business_id: int):
    """Create various loyalty programs for Econet"""
    programs = []
    
    # 1. EcoPoints - Basic Points Program
    ecopoints = models.LoyaltyProgram(
        business_id=business_id,
        name="EcoPoints",
        program_type=models.LoyaltyProgramType.POINTS,
        description="Earn points on every recharge and data purchase. 1 point for every $1 spent.",
        active=True,
        earn_rate=1.0,
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(ecopoints)
    db.commit()
    db.refresh(ecopoints)
    programs.append(ecopoints)
    
    # 2. EcoVIP - Tiered Program
    ecovip = models.LoyaltyProgram(
        business_id=business_id,
        name="EcoVIP",
        program_type=models.LoyaltyProgramType.TIERED,
        description="Multi-tier loyalty program with escalating benefits based on spending.",
        active=True,
        earn_rate=1.5,
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(ecovip)
    db.commit()
    db.refresh(ecovip)
    programs.append(ecovip)
    
    # 3. EcoReferral - Referral Program
    ecoreferral = models.LoyaltyProgram(
        business_id=business_id,
        name="EcoReferral",
        program_type=models.LoyaltyProgramType.REFERRAL,
        description="Refer friends and family to earn bonus points and rewards.",
        active=True,
        earn_rate=100.0,  # 100 points per referral
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(ecoreferral)
    db.commit()
    db.refresh(ecoreferral)
    programs.append(ecoreferral)
    
    # 4. EcoCashback - Cashback Program
    ecocashback = models.LoyaltyProgram(
        business_id=business_id,
        name="EcoCashback",
        program_type=models.LoyaltyProgramType.CASHBACK,
        description="Get 3% cashback on all data purchases and international calls.",
        active=True,
        earn_rate=0.03,  # 3% cashback
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(ecocashback)
    db.commit()
    db.refresh(ecocashback)
    programs.append(ecocashback)
    
    # 5. EcoPremium - Paid Premium Program
    ecopremium = models.LoyaltyProgram(
        business_id=business_id,
        name="EcoPremium",
        program_type=models.LoyaltyProgramType.PAID,
        description="Premium membership with exclusive benefits, priority support, and bonus rewards.",
        active=True,
        earn_rate=2.0,  # 2x points multiplier
        membership_fee=25.0,  # $25 annual fee
        membership_period_days=365,
        membership_benefits="Priority customer support, 2x points on all purchases, exclusive data offers, free international SMS",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(ecopremium)
    db.commit()
    db.refresh(ecopremium)
    programs.append(ecopremium)
    
    print(f"Created {len(programs)} loyalty programs")
    return programs

def create_tier_levels(db: Session, ecovip_program_id: int):
    """Create tier levels for EcoVIP program"""
    tiers = [
        {
            "name": "Bronze",
            "min_points": 0,
            "benefits": "Basic customer support, monthly data bonus 100MB",
            "multiplier": 1.0
        },
        {
            "name": "Silver",
            "min_points": 500,
            "benefits": "Priority support, monthly data bonus 500MB, 10% discount on international calls",
            "multiplier": 1.25
        },
        {
            "name": "Gold",
            "min_points": 1500,
            "benefits": "Premium support, monthly data bonus 1GB, 15% discount on international calls, free SMS bundle",
            "multiplier": 1.5
        },
        {
            "name": "Platinum",
            "min_points": 3000,
            "benefits": "VIP support, monthly data bonus 2GB, 20% discount on all services, free voice bundle, device insurance",
            "multiplier": 2.0
        }
    ]
    
    tier_objects = []
    for tier_data in tiers:
        tier = models.TierLevel(
            loyalty_program_id=ecovip_program_id,
            name=tier_data["name"],
            min_points=tier_data["min_points"],
            benefits=tier_data["benefits"],
            multiplier=tier_data["multiplier"]
        )
        db.add(tier)
        tier_objects.append(tier)
    
    db.commit()
    print(f"Created {len(tier_objects)} tier levels")
    return tier_objects

def create_rewards(db: Session, programs: List[models.LoyaltyProgram]):
    """Create rewards for each loyalty program"""
    rewards_data = {
        "EcoPoints": [
            {"name": "100MB Data Bundle", "description": "Get 100MB data bundle valid for 24 hours", "points": 50},
            {"name": "500MB Data Bundle", "description": "Get 500MB data bundle valid for 7 days", "points": 150},
            {"name": "1GB Data Bundle", "description": "Get 1GB data bundle valid for 30 days", "points": 250},
            {"name": "Free SMS Bundle", "description": "100 free SMS to any network", "points": 100},
            {"name": "Voice Bundle", "description": "30 minutes free calls to Econet numbers", "points": 200},
            {"name": "International Call Credit", "description": "$5 credit for international calls", "points": 500},
            {"name": "Device Discount", "description": "10% discount on next device purchase", "points": 800},
            {"name": "Premium Support", "description": "Priority customer support for 3 months", "points": 300}
        ],
        "EcoVIP": [
            {"name": "VIP Data Bundle", "description": "2GB high-speed data bundle", "points": 400},
            {"name": "VIP Voice Bundle", "description": "60 minutes free calls to any network", "points": 300},
            {"name": "VIP SMS Bundle", "description": "500 free SMS to any network", "points": 200},
            {"name": "Tier Upgrade Bonus", "description": "Instant 100 bonus points on tier upgrade", "points": 0},
            {"name": "Monthly VIP Package", "description": "Monthly package with calls, SMS, and data", "points": 1000},
            {"name": "International Roaming", "description": "Free international roaming for 7 days", "points": 1500}
        ],
        "EcoReferral": [
            {"name": "Referral Bonus", "description": "Bonus points for successful referral", "points": 100},
            {"name": "Friend & Family Bundle", "description": "Special bundle for referrer and referee", "points": 300},
            {"name": "Group Discount", "description": "10% group discount for 5+ referrals", "points": 500}
        ],
        "EcoCashback": [
            {"name": "Cashback Redemption", "description": "Convert cashback to account credit", "points": 100},
            {"name": "Double Cashback Week", "description": "2x cashback for one week", "points": 500}
        ],
        "EcoPremium": [
            {"name": "Premium Data Bundle", "description": "5GB premium data bundle", "points": 300},
            {"name": "Premium Voice Bundle", "description": "120 minutes free calls to any network", "points": 400},
            {"name": "Premium Device Discount", "description": "25% discount on premium devices", "points": 1000},
            {"name": "Concierge Service", "description": "Personal account manager for 6 months", "points": 2000}
        ]
    }
    
    all_rewards = []
    for program in programs:
        program_rewards = rewards_data.get(program.name, [])
        for reward_data in program_rewards:
            reward = models.Reward(
                loyalty_program_id=program.id,
                name=reward_data["name"],
                description=reward_data["description"],
                points_required=reward_data["points"],
                is_active=True,
                stock_limit=None,
                created_at=datetime.datetime.now(datetime.UTC)
            )
            db.add(reward)
            all_rewards.append(reward)
    
    db.commit()
    print(f"Created {len(all_rewards)} rewards")
    return all_rewards

def create_customers(db: Session, num_customers: int = 50):
    """Create diverse customer base"""
    zimbabwe_prefixes = ["+263771", "+263772", "+263773", "+263774", "+263775", "+263776", "+263777", "+263778"]
    
    customers = []
    for i in range(num_customers):
        prefix = random.choice(zimbabwe_prefixes)
        phone_number = f"{prefix}{random.randint(100000, 999999)}"
        
        # Check if phone number already exists
        existing = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
        if existing:
            continue
            
        customer = models.Customer(
            phone_number=phone_number,
            total_points=random.randint(0, 2000),
            referral_code=generate_referral_code(),
            created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=random.randint(0, 365))
        )
        db.add(customer)
        customers.append(customer)
    
    db.commit()
    print(f"Created {len(customers)} customers")
    return customers

def create_customer_memberships(db: Session, customers: List[models.Customer], programs: List[models.LoyaltyProgram], tiers: List[models.TierLevel]):
    """Create customer memberships across different programs"""
    memberships = []
    
    for customer in customers:
        # Each customer joins 1-3 programs randomly
        num_programs = random.randint(1, 3)
        selected_programs = random.sample(programs, min(num_programs, len(programs)))
        
        for program in selected_programs:
            points = random.randint(0, 1000)
            
            # Determine tier for tiered programs
            current_tier = None
            if program.program_type == models.LoyaltyProgramType.TIERED:
                eligible_tiers = [t for t in tiers if t.loyalty_program_id == program.id and t.min_points <= points]
                if eligible_tiers:
                    current_tier = max(eligible_tiers, key=lambda t: t.min_points)
            
            # Handle paid memberships
            is_paid = False
            membership_start = None
            membership_end = None
            if program.program_type == models.LoyaltyProgramType.PAID and random.random() < 0.3:  # 30% chance of paid membership
                is_paid = True
                membership_start = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=random.randint(0, 180))
                membership_end = membership_start + datetime.timedelta(days=program.membership_period_days)
            
            membership = models.CustomerMembership(
                customer_id=customer.id,
                loyalty_program_id=program.id,
                current_tier_id=current_tier.id if current_tier else None,
                points=points,
                is_paid_member=is_paid,
                membership_start=membership_start,
                membership_end=membership_end
            )
            db.add(membership)
            memberships.append(membership)
    
    db.commit()
    print(f"Created {len(memberships)} customer memberships")
    return memberships

def create_transactions(db: Session, business_id: int, customers: List[models.Customer], programs: List[models.LoyaltyProgram], num_transactions: int = 200):
    """Create realistic telecom transactions"""
    # Telecom service types and their typical pricing
    services = [
        {"name": "Data Bundle 1GB", "price_range": (5, 8), "points_multiplier": 1.0},
        {"name": "Data Bundle 5GB", "price_range": (20, 25), "points_multiplier": 1.2},
        {"name": "Voice Bundle 100min", "price_range": (10, 15), "points_multiplier": 1.0},
        {"name": "SMS Bundle 1000", "price_range": (3, 5), "points_multiplier": 0.8},
        {"name": "International Call Credit", "price_range": (15, 50), "points_multiplier": 1.5},
        {"name": "Device Purchase", "price_range": (100, 800), "points_multiplier": 1.0},
        {"name": "Monthly Package", "price_range": (30, 80), "points_multiplier": 1.3},
        {"name": "Roaming Package", "price_range": (25, 100), "points_multiplier": 1.4}
    ]
    
    transactions = []
    
    for i in range(num_transactions):
        customer = random.choice(customers)
        service = random.choice(services)
        program = random.choice(programs)
        
        amount_spent = random.uniform(service["price_range"][0], service["price_range"][1])
        
        # Calculate points based on program type
        points_earned = 0
        cashback_amount = 0.0
        
        if program.program_type == models.LoyaltyProgramType.POINTS:
            points_earned = int(amount_spent * program.earn_rate * service["points_multiplier"])
        elif program.program_type == models.LoyaltyProgramType.TIERED:
            base_points = int(amount_spent * program.earn_rate * service["points_multiplier"])
            # Apply tier multiplier if customer has membership
            membership = db.query(models.CustomerMembership).filter(
                models.CustomerMembership.customer_id == customer.id,
                models.CustomerMembership.loyalty_program_id == program.id
            ).first()
            if membership and membership.current_tier_id:
                tier = db.query(models.TierLevel).filter(models.TierLevel.id == membership.current_tier_id).first()
                if tier:
                    points_earned = int(base_points * tier.multiplier)
            else:
                points_earned = base_points
        elif program.program_type == models.LoyaltyProgramType.CASHBACK:
            cashback_amount = amount_spent * program.earn_rate
            points_earned = int(cashback_amount * 10)  # Convert cashback to points for tracking
        elif program.program_type == models.LoyaltyProgramType.PAID:
            membership = db.query(models.CustomerMembership).filter(
                models.CustomerMembership.customer_id == customer.id,
                models.CustomerMembership.loyalty_program_id == program.id,
                models.CustomerMembership.is_paid_member == True
            ).first()
            if membership:
                points_earned = int(amount_spent * program.earn_rate * service["points_multiplier"])
        
        transaction = models.Transaction(
            business_id=business_id,
            customer_id=customer.id,
            loyalty_program_id=program.id,
            amount_spent=amount_spent,
            points_earned=points_earned,
            cashback_amount=cashback_amount,
            transaction_type=models.TransactionType.EARN,
            reward_description=service["name"],
            timestamp=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=random.randint(0, 180))
        )
        db.add(transaction)
        transactions.append(transaction)
        
        # Update customer's total points for legacy compatibility
        customer.total_points += points_earned
    
    db.commit()
    print(f"Created {len(transactions)} transactions")
    return transactions

def create_referrals(db: Session, business_id: int, customers: List[models.Customer], programs: List[models.LoyaltyProgram], num_referrals: int = 20):
    """Create referral relationships"""
    referrals = []
    referral_program = next((p for p in programs if p.program_type == models.LoyaltyProgramType.REFERRAL), None)
    
    if not referral_program:
        print("No referral program found, skipping referral creation")
        return referrals
    
    for i in range(num_referrals):
        if len(customers) < 2:
            break
            
        referrer = random.choice(customers)
        potential_referred = [c for c in customers if c.id != referrer.id]
        referred = random.choice(potential_referred)
        
        points_awarded = random.randint(50, 150)
        
        referral = models.Referral(
            referrer_id=referrer.id,
            referred_id=referred.id,
            business_id=business_id,
            loyalty_program_id=referral_program.id,
            points_awarded=points_awarded,
            created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=random.randint(0, 90))
        )
        db.add(referral)
        referrals.append(referral)
        
        # Update referrer's points
        referrer.total_points += points_awarded
    
    db.commit()
    print(f"Created {len(referrals)} referrals")
    return referrals

def create_redemption_transactions(db: Session, business_id: int, customers: List[models.Customer], programs: List[models.LoyaltyProgram], rewards: List[models.Reward], num_redemptions: int = 30):
    """Create redemption transactions"""
    redemptions = []
    
    for i in range(num_redemptions):
        customer = random.choice(customers)
        reward = random.choice(rewards)
        
        # Check if customer has enough points
        membership = db.query(models.CustomerMembership).filter(
            models.CustomerMembership.customer_id == customer.id,
            models.CustomerMembership.loyalty_program_id == reward.loyalty_program_id
        ).first()
        
        if not membership or membership.points < reward.points_required:
            continue
        
        # Create redemption transaction
        transaction = models.Transaction(
            business_id=business_id,
            customer_id=customer.id,
            loyalty_program_id=reward.loyalty_program_id,
            amount_spent=0,
            points_earned=-reward.points_required,  # Negative points for redemption
            transaction_type=models.TransactionType.REDEMPTION,
            reward_description=f"Redeemed: {reward.name}",
            timestamp=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=random.randint(0, 60))
        )
        db.add(transaction)
        redemptions.append(transaction)
        
        # Update customer's points
        customer.total_points -= reward.points_required
        membership.points -= reward.points_required
    
    db.commit()
    print(f"Created {len(redemptions)} redemption transactions")
    return redemptions

def main():
    """Main function to populate the database"""
    print("🚀 Starting Econet Telecom Demo Data Population...")
    
    db = get_db()
    
    try:
        # 1. Create Econet business
        print("\n📊 Creating Econet business...")
        business = create_econet_business(db)
        
        # 2. Create loyalty programs
        print("\n🎯 Creating loyalty programs...")
        programs = create_loyalty_programs(db, business.id)
        
        # 3. Create tier levels for VIP program
        print("\n🏆 Creating tier levels...")
        ecovip_program = next((p for p in programs if p.name == "EcoVIP"), None)
        tiers = []
        if ecovip_program:
            tiers = create_tier_levels(db, ecovip_program.id)
        
        # 4. Create rewards
        print("\n🎁 Creating rewards...")
        rewards = create_rewards(db, programs)
        
        # 5. Create customers
        print("\n👥 Creating customers...")
        customers = create_customers(db, 50)
        
        # 6. Create customer memberships
        print("\n🔗 Creating customer memberships...")
        memberships = create_customer_memberships(db, customers, programs, tiers)
        
        # 7. Create transactions
        print("\n💳 Creating transactions...")
        transactions = create_transactions(db, business.id, customers, programs, 200)
        
        # 8. Create referrals
        print("\n🤝 Creating referrals...")
        referrals = create_referrals(db, business.id, customers, programs, 20)
        
        # 9. Create redemption transactions
        print("\n🎁 Creating redemption transactions...")
        redemptions = create_redemption_transactions(db, business.id, customers, programs, rewards, 30)
        
        print("\n✅ Econet Demo Data Population Complete!")
        print(f"""
📈 Summary:
- Business: Econet Telecom (ID: {business.id})
- Email: econet@econet.com
- Password: Password123
- Loyalty Programs: {len(programs)}
- Tier Levels: {len(tiers)}
- Rewards: {len(rewards)}
- Customers: {len(customers)}
- Memberships: {len(memberships)}
- Transactions: {len(transactions)}
- Referrals: {len(referrals)}
- Redemptions: {len(redemptions)}
        """)
        
    except Exception as e:
        print(f"❌ Error during data population: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
