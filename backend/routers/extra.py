from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, models
from database import get_db
from typing import List, Optional
import datetime

router = APIRouter(
    prefix="",
    tags=["extra"],
)

# --- Enhanced AI Recommendations ---
@router.get("/customers/recommendations/{phone_number}")
def get_recommendations(phone_number: str = Path(...), business_id: int = Query(None), db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    recs = []
    
    # Get customer's transaction history
    transactions = db.query(models.Transaction).filter(
        models.Transaction.customer_id == customer.id
    ).order_by(models.Transaction.timestamp.desc()).all()
    
    if not transactions:
        return {"recommendations": ["Welcome! Start earning points with your first purchase."]}
    
    # Rule 1: Near reward threshold (dynamic based on business loyalty programs)
    if business_id:
        # Get business's loyalty programs and their rewards
        programs = db.query(models.LoyaltyProgram).filter(
            models.LoyaltyProgram.business_id == business_id,
            models.LoyaltyProgram.active == True
        ).all()
        
        for program in programs:
            rewards = db.query(models.Reward).filter(
                models.Reward.loyalty_program_id == program.id,
                models.Reward.is_active == True
            ).order_by(models.Reward.points_required.asc()).all()
            
            if rewards:
                next_reward = rewards[0]  # Lowest points required
                points_needed = next_reward.points_required - customer.total_points
                if 0 < points_needed <= 50:
                    recs.append(f"You're only {points_needed} points away from '{next_reward.name}'! Make another purchase to redeem.")
    
    # Rule 2: Spending pattern analysis
    if len(transactions) >= 3:
        avg_spending = sum(t.amount_spent for t in transactions[:10]) / len(transactions[:10])
        last_transaction = transactions[0]
        
        if last_transaction.amount_spent < avg_spending * 0.7:
            recs.append(f"Your last purchase was smaller than usual. Consider trying our premium offerings!")
        elif last_transaction.amount_spent > avg_spending * 1.3:
            recs.append(f"Thanks for your increased spending! You've earned {last_transaction.points_earned} extra points.")
    
    # Rule 3: Inactivity with personalized comeback
    last_txn = transactions[0]
    days_since_last = (datetime.datetime.utcnow() - last_txn.timestamp).days
    
    if days_since_last > 30:
        if business_id:
            business = db.query(models.Business).filter(models.Business.id == business_id).first()
            if business:
                recs.append(f"We miss you at {business.name}! Come back within 7 days for a 20% points bonus.")
        else:
            recs.append("We miss you! Visit your favorite business for a special offer.")
    elif days_since_last > 14:
        recs.append("It's been a while! Don't forget to use your accumulated points.")
    
    # Rule 4: Referral opportunities
    if customer.referral_code:
        referral_count = db.query(models.Referral).filter(
            models.Referral.referrer_id == customer.id
        ).count()
        
        if referral_count == 0:
            recs.append(f"Share your referral code '{customer.referral_code}' with friends and earn 50 points for each new customer!")
        elif referral_count < 5:
            recs.append(f"You've referred {referral_count} friends! Keep sharing your code '{customer.referral_code}' for more rewards.")
    
    # Rule 5: High-value customer recognition
    total_spent = sum(t.amount_spent for t in transactions)
    if total_spent > 500:
        recs.append("You're a valued customer! Ask about our VIP program benefits.")
    
    # Rule 6: Cross-promotion based on transaction history
    if business_id:
        # Find other businesses this customer hasn't visited
        visited_businesses = set(t.business_id for t in transactions)
        other_businesses = db.query(models.Business).filter(
            ~models.Business.id.in_(visited_businesses),
            models.Business.id != business_id
        ).limit(2).all()
        
        for business in other_businesses:
            recs.append(f"Try {business.name} for a new experience! Show this message for a welcome bonus.")
    
    return {
        "recommendations": recs or ["Keep earning points for more rewards!"],
        "customer_stats": {
            "total_transactions": len(transactions),
            "total_spent": sum(t.amount_spent for t in transactions),
            "total_points": customer.total_points,
            "days_since_last_visit": days_since_last,
            "referral_code": customer.referral_code
        }
    }

# --- Referral Endpoints ---
@router.post("/referrals/track")
def track_referral(
    business_id: int = Query(...),
    new_customer_phone_number: str = Query(...),
    referrer_phone_number: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Record the potential referral
    new_customer = db.query(models.Customer).filter(models.Customer.phone_number == new_customer_phone_number).first()
    if not new_customer:
        from crud_loyalty_programs import generate_referral_code
        new_customer = models.Customer(
            phone_number=new_customer_phone_number, 
            total_points=0,
            referral_code=generate_referral_code()
        )
        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)
    referrer = None
    if referrer_phone_number:
        referrer = db.query(models.Customer).filter(models.Customer.phone_number == referrer_phone_number).first()
    referral = models.Referral(
        referrer_id=referrer.id if referrer else None,
        referred_id=new_customer.id,
        business_id=business_id,
        points_awarded=0,  # Will be set when completed
        created_at=datetime.datetime.utcnow()
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return {"referral_id": referral.id, "status": "pending"}

@router.post("/referrals/complete")
def complete_referral(
    referral_id: int = Query(...),
    points_to_award_referrer: int = Query(...),
    db: Session = Depends(get_db)
):
    referral = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    if referral.points_awarded > 0:
        return {"message": "Referral already completed"}
    
    referrer = db.query(models.Customer).filter(models.Customer.id == referral.referrer_id).first()
    if referrer:
        referrer.total_points += points_to_award_referrer
        referral.points_awarded = points_to_award_referrer
        db.commit()
    
    return {"message": "Referral completed and points awarded"}

@router.get("/referrals/all", response_model=List[dict])
def get_all_referrals(
    business_id: int = Query(...),
    db: Session = Depends(get_db)
):
    referrals = db.query(models.Referral).filter(models.Referral.business_id == business_id).all()
    result = []
    for r in referrals:
        referrer = db.query(models.Customer).filter(models.Customer.id == r.referrer_id).first() if r.referrer_id else None
        referred = db.query(models.Customer).filter(models.Customer.id == r.referred_id).first() if r.referred_id else None
        result.append({
            "referral_id": r.id,
            "status": "completed" if r.points_awarded > 0 else "pending",
            "referrer_phone": referrer.phone_number if referrer else None,
            "referred_phone": referred.phone_number if referred else None,
            "business_id": r.business_id,
            "points_awarded": r.points_awarded
        })
    return result

# --- Reporting Endpoints ---
@router.get("/reports/total_points_issued")
def total_points_issued(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    base_filter = [models.Transaction.business_id == business_id, models.Transaction.points_earned > 0]
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    total = db.query(models.Transaction).filter(*base_filter).with_entities(models.Transaction.points_earned).all()
    return {"total_points_issued": sum(t[0] for t in total)}

@router.get("/reports/total_redemptions")
def total_redemptions(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    base_filter = [models.Transaction.business_id == business_id, models.Transaction.transaction_type == models.TransactionType.REDEMPTION]
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    total = db.query(models.Transaction).filter(*base_filter).with_entities(models.Transaction.points_earned).all()
    return {"total_redemptions": -sum(t[0] for t in total)}

@router.get("/reports/customer_count")
def customer_count(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    base_filter = [models.Transaction.business_id == business_id]
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    count = db.query(models.Transaction.customer_id).filter(*base_filter).distinct().count()
    return {"customer_count": count}

@router.get("/reports/top_customers")
def top_customers(business_id: int = Query(...), n: int = Query(5), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    base_filter = [models.Transaction.business_id == business_id]
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    results = db.query(models.Customer.phone_number, func.sum(models.Transaction.points_earned).label('points')).join(models.Transaction).filter(*base_filter).group_by(models.Customer.id).order_by(func.sum(models.Transaction.points_earned).desc()).limit(n).all()
    return [{"phone_number": r[0], "points": r[1]} for r in results]

@router.get("/reports/all_customers")
def all_customers(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    base_filter = [models.Transaction.business_id == business_id]
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    results = db.query(models.Customer.phone_number, func.sum(models.Transaction.points_earned).label('points')).join(models.Transaction).filter(*base_filter).group_by(models.Customer.id).order_by(func.sum(models.Transaction.points_earned).desc()).all()
    return [{"phone_number": r[0], "points": r[1]} for r in results]

# --- MCP Endpoints ---
@router.get("/mcp/customer/points/{phone_number}")
def mcp_customer_points(phone_number: str, db: Session = Depends(get_db)):
    return crud.get_customer_points(db, phone_number)

@router.get("/mcp/customer/transactions/{phone_number}")
def mcp_customer_transactions(phone_number: str, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    txns = db.query(models.Transaction).filter(models.Transaction.customer_id == customer.id).order_by(models.Transaction.timestamp.desc()).all()
    return [{"amount_spent": t.amount_spent, "points_earned": t.points_earned, "type": t.transaction_type.value, "timestamp": t.timestamp} for t in txns]

@router.get("/mcp/business/{business_id}")
def mcp_business(business_id: int, db: Session = Depends(get_db)):
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"id": business.id, "name": business.name, "contact_person": business.contact_person, "email": business.email, "loyalty_rate": business.loyalty_rate}

@router.get("/mcp/recommendations/{phone_number}")
def mcp_recommendations(phone_number: str, db: Session = Depends(get_db)):
    return get_recommendations(phone_number, db)

# --- Enhanced Analytics Endpoints ---
@router.get("/analytics/revenue_stats")
def revenue_stats(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    """Get revenue statistics for the business"""
    from sqlalchemy import func
    
    # Base filter
    base_filter = [models.Transaction.business_id == business_id]
    
    # Add loyalty program filter if specified
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    # Total revenue
    total_revenue = db.query(func.sum(models.Transaction.amount_spent)).filter(
        *base_filter
    ).scalar() or 0
    
    # Average transaction value
    avg_transaction = db.query(func.avg(models.Transaction.amount_spent)).filter(
        *base_filter,
        models.Transaction.amount_spent > 0
    ).scalar() or 0
    
    # Monthly revenue trend (last 6 months) - using SQLite compatible functions
    from datetime import datetime, timedelta
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    
    # Get raw data and process in Python since SQLite doesn't have date_trunc
    transactions = db.query(
        models.Transaction.timestamp,
        models.Transaction.amount_spent
    ).filter(
        *base_filter,
        models.Transaction.timestamp >= six_months_ago
    ).all()
    
    # Group by month in Python
    monthly_data = {}
    for txn in transactions:
        month_key = txn.timestamp.strftime('%Y-%m')
        if month_key not in monthly_data:
            monthly_data[month_key] = 0
        monthly_data[month_key] += txn.amount_spent
    
    monthly_revenue = [{"month": k, "revenue": v} for k, v in sorted(monthly_data.items())]
    
    return {
        "total_revenue": float(total_revenue),
        "average_transaction": float(avg_transaction),
        "monthly_revenue": monthly_revenue
    }

@router.get("/analytics/customer_insights")
def customer_insights(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    """Get customer behavior insights"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    # Base filter
    base_filter = [models.Transaction.business_id == business_id]
    
    # Add loyalty program filter if specified
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    # New customers (customers with only one transaction in the last 30 days)
    new_customers = db.query(models.Customer.id).join(models.Transaction).filter(
        *base_filter,
        models.Transaction.timestamp >= last_30_days
    ).group_by(models.Customer.id).having(func.count(models.Transaction.id) == 1).count()
    
    # Repeat customers (customers with more than one transaction ever)
    repeat_customers = db.query(models.Customer.id).join(models.Transaction).filter(
        *base_filter
    ).group_by(models.Customer.id).having(func.count(models.Transaction.id) > 1).count()
    
    # High value customers - simplified approach
    # Get all customers and their total spending, then find top 20%
    customer_spending = db.query(
        models.Customer.id,
        func.sum(models.Transaction.amount_spent).label('total_spent')
    ).join(models.Transaction).filter(
        *base_filter
    ).group_by(models.Customer.id).all()
    
    if customer_spending:
        spending_amounts = [cs.total_spent for cs in customer_spending]
        spending_amounts.sort(reverse=True)
        threshold_index = int(len(spending_amounts) * 0.2)  # Top 20%
        if threshold_index < len(spending_amounts):
            threshold = spending_amounts[threshold_index]
            high_value_customers = len([s for s in spending_amounts if s >= threshold])
        else:
            high_value_customers = len(spending_amounts)
    else:
        high_value_customers = 0
    
    # Active customers (customers who made purchase in last 30 days)
    active_customers = db.query(models.Customer.id).join(models.Transaction).filter(
        *base_filter,
        models.Transaction.timestamp >= last_30_days
    ).distinct().count()
    
    return {
        "new_customers_this_month": new_customers,
        "repeat_customers": repeat_customers,
        "high_value_customers": high_value_customers,
        "active_customers_this_month": active_customers
    }

@router.get("/analytics/loyalty_performance")
def loyalty_performance(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    """Get loyalty program performance metrics"""
    from sqlalchemy import func
    
    # Base filter
    base_filter = [models.Transaction.business_id == business_id]
    
    # Add loyalty program filter if specified
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    # Points economics
    total_points_issued = db.query(func.sum(models.Transaction.points_earned)).filter(
        *base_filter,
        models.Transaction.points_earned > 0
    ).scalar() or 0
    
    total_points_redeemed = db.query(func.sum(models.Transaction.points_earned)).filter(
        *base_filter,
        models.Transaction.transaction_type == models.TransactionType.REDEMPTION
    ).scalar() or 0
    
    outstanding_points = total_points_issued + total_points_redeemed  # redeemed points are negative
    
    # Redemption rate
    redemption_rate = (abs(total_points_redeemed) / total_points_issued * 100) if total_points_issued > 0 else 0
    
    # Average points per transaction
    avg_points_per_transaction = db.query(func.avg(models.Transaction.points_earned)).filter(
        *base_filter,
        models.Transaction.points_earned > 0
    ).scalar() or 0
    
    # Loyalty program adoption
    customers_with_points = db.query(models.Customer.id).join(models.Transaction).filter(
        *base_filter
    ).group_by(models.Customer.id).having(func.sum(models.Transaction.points_earned) > 0).count()
    
    total_customers = db.query(models.Customer.id).join(models.Transaction).filter(
        *base_filter
    ).distinct().count()
    
    adoption_rate = (customers_with_points / total_customers * 100) if total_customers > 0 else 0
    
    return {
        "total_points_issued": int(total_points_issued),
        "total_points_redeemed": abs(int(total_points_redeemed)),
        "outstanding_points": int(outstanding_points),
        "redemption_rate": round(redemption_rate, 2),
        "avg_points_per_transaction": round(float(avg_points_per_transaction), 2),
        "loyalty_adoption_rate": round(adoption_rate, 2)
    }

@router.get("/analytics/business_health")
def business_health(business_id: int = Query(...), loyalty_program_id: int = Query(None), db: Session = Depends(get_db)):
    """Get overall business health metrics"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Transaction frequency
    last_30_days = datetime.utcnow() - timedelta(days=30)
    last_60_days = datetime.utcnow() - timedelta(days=60)
    
    # Base filter
    base_filter = [models.Transaction.business_id == business_id]
    
    # Add loyalty program filter if specified
    if loyalty_program_id:
        base_filter.append(models.Transaction.loyalty_program_id == loyalty_program_id)
    
    transactions_this_month = db.query(models.Transaction).filter(
        *base_filter,
        models.Transaction.timestamp >= last_30_days
    ).count()
    
    transactions_last_month = db.query(models.Transaction).filter(
        *base_filter,
        models.Transaction.timestamp >= last_60_days,
        models.Transaction.timestamp < last_30_days
    ).count()
    
    # Growth rate
    growth_rate = ((transactions_this_month - transactions_last_month) / transactions_last_month * 100) if transactions_last_month > 0 else 0
    
    # Customer lifetime value estimate - simplified approach
    # Get average spending per customer
    customer_totals = db.query(
        func.sum(models.Transaction.amount_spent).label('total')
    ).filter(
        *base_filter
    ).group_by(models.Transaction.customer_id).subquery()
    
    avg_customer_value = db.query(func.avg(customer_totals.c.total)).scalar() or 0
    
    # Peak transaction hours
    peak_hours = db.query(
        func.strftime('%H', models.Transaction.timestamp).label('hour'),
        func.count(models.Transaction.id).label('count')
    ).filter(
        *base_filter,
        models.Transaction.timestamp >= last_30_days
    ).group_by(func.strftime('%H', models.Transaction.timestamp)).order_by(func.count(models.Transaction.id).desc()).limit(3).all()
    
    return {
        "transactions_this_month": transactions_this_month,
        "transactions_last_month": transactions_last_month,
        "growth_rate": round(growth_rate, 2),
        "avg_customer_lifetime_value": round(float(avg_customer_value), 2),
        "peak_hours": [{"hour": int(h[0]), "count": h[1]} for h in peak_hours if h[0]]
    }

# --- Enhanced Referral/Affiliate Code Endpoints ---
@router.get("/customers/{phone_number}/referral-code")
def get_customer_referral_code(phone_number: str = Path(...), db: Session = Depends(get_db)):
    """Get a customer's referral code"""
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate referral code if not exists
    if not customer.referral_code:
        from crud_loyalty_programs import generate_referral_code
        customer.referral_code = generate_referral_code()
        db.commit()
        db.refresh(customer)
    
    return {
        "phone_number": customer.phone_number,
        "referral_code": customer.referral_code,
        "total_points": customer.total_points
    }

@router.get("/referral-codes/{referral_code}/customer")
def get_customer_by_referral_code(referral_code: str = Path(...), db: Session = Depends(get_db)):
    """Find customer by referral code"""
    customer = db.query(models.Customer).filter(models.Customer.referral_code == referral_code).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    return {
        "phone_number": customer.phone_number,
        "referral_code": customer.referral_code,
        "total_points": customer.total_points
    }

@router.post("/transactions/with-referral")
def process_transaction_with_referral(
    business_id: int = Query(...),
    customer_phone_number: str = Query(...),
    amount_spent: float = Query(...),
    referral_code: str = Query(...),
    loyalty_program_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """Process a transaction where a new customer uses a referral code"""
    
    # Find the referrer by code
    referrer = db.query(models.Customer).filter(models.Customer.referral_code == referral_code).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Check if the customer already exists
    customer = db.query(models.Customer).filter(models.Customer.phone_number == customer_phone_number).first()
    is_new_customer = not customer
    
    if not customer:
        from crud_loyalty_programs import generate_referral_code
        customer = models.Customer(
            phone_number=customer_phone_number, 
            total_points=0, 
            referral_code=generate_referral_code()
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # Only process referral if this is a new customer
    if is_new_customer:
        # Create referral record
        referral = models.Referral(
            referrer_id=referrer.id,
            referred_id=customer.id,
            business_id=business_id,
            loyalty_program_id=loyalty_program_id,
            points_awarded=50,  # Default referral points
            created_at=datetime.datetime.utcnow()
        )
        db.add(referral)
        
        # Award points to referrer (add to legacy total_points for backward compatibility)
        referrer.total_points += 50
        
        # Process the transaction for the new customer
        business = db.query(models.Business).filter(models.Business.id == business_id).first()
        if business:
            points_earned = int(amount_spent * business.loyalty_rate)
            customer.total_points += points_earned
            
            # Create transaction record
            transaction = models.Transaction(
                business_id=business_id,
                customer_id=customer.id,
                loyalty_program_id=loyalty_program_id,
                amount_spent=amount_spent,
                points_earned=points_earned,
                transaction_type=models.TransactionType.EARN,
                referral_id=referral.id,
                timestamp=datetime.datetime.utcnow()
            )
            db.add(transaction)
            
            # Create referral bonus transaction for referrer
            referral_transaction = models.Transaction(
                business_id=business_id,
                customer_id=referrer.id,
                loyalty_program_id=loyalty_program_id,
                amount_spent=0,
                points_earned=50,
                transaction_type=models.TransactionType.REFERRAL,
                referral_id=referral.id,
                reward_description=f"Referral bonus for {customer_phone_number}",
                timestamp=datetime.datetime.utcnow()
            )
            db.add(referral_transaction)
            
            db.commit()
            
            return {
                "message": "Transaction processed with referral bonus",
                "new_customer": {
                    "phone_number": customer.phone_number,
                    "points_earned": points_earned,
                    "total_points": customer.total_points
                },
                "referrer": {
                    "phone_number": referrer.phone_number,
                    "referral_bonus": 50,
                    "total_points": referrer.total_points
                },
                "referral_id": referral.id
            }
    else:
        raise HTTPException(status_code=400, detail="Customer already exists - referral code cannot be used")

@router.get("/analytics/referral_performance")
def referral_performance_analytics(business_id: int = Query(...), db: Session = Depends(get_db)):
    """Get referral program performance analytics"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    # Total referrals created
    total_referrals = db.query(models.Referral).filter(
        models.Referral.business_id == business_id
    ).count()
    
    # Referrals in last 30 days
    recent_referrals = db.query(models.Referral).filter(
        models.Referral.business_id == business_id,
        models.Referral.created_at >= last_30_days
    ).count()
    
    # Top referrers
    top_referrers = db.query(
        models.Customer.phone_number,
        func.count(models.Referral.id).label('referral_count'),
        func.sum(models.Referral.points_awarded).label('total_points_earned')
    ).join(
        models.Referral, models.Customer.id == models.Referral.referrer_id
    ).filter(
        models.Referral.business_id == business_id
    ).group_by(models.Customer.id).order_by(
        func.count(models.Referral.id).desc()
    ).limit(10).all()
    
    # Referral conversion rate (customers who made purchases after being referred)
    referred_customers = db.query(models.Referral.referred_id).filter(
        models.Referral.business_id == business_id
    ).subquery()
    
    referred_with_purchases = db.query(models.Transaction.customer_id).filter(
        models.Transaction.business_id == business_id,
        models.Transaction.customer_id.in_(referred_customers)
    ).distinct().count()
    
    conversion_rate = (referred_with_purchases / total_referrals * 100) if total_referrals > 0 else 0
    
    return {
        "total_referrals": total_referrals,
        "recent_referrals": recent_referrals,
        "conversion_rate": round(conversion_rate, 2),
        "top_referrers": [
            {
                "phone_number": r[0],
                "referral_count": r[1],
                "total_points_earned": r[2] or 0
            } for r in top_referrers
        ]
    }

# --- Utility Endpoints ---
@router.get("/customers/list")
def list_customers(limit: int = Query(10), db: Session = Depends(get_db)):
    """List existing customers (for testing/admin purposes)"""
    customers = db.query(models.Customer).limit(limit).all()
    return [
        {
            "phone_number": c.phone_number,
            "total_points": c.total_points,
            "referral_code": c.referral_code,
            "created_at": c.created_at
        } for c in customers
    ]

@router.post("/customers/create")
def create_customer(
    phone_number: str = Query(...),
    initial_points: int = Query(0),
    db: Session = Depends(get_db)
):
    """Create a new customer (for testing purposes)"""
    existing_customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer already exists")
    
    from crud_loyalty_programs import generate_referral_code
    customer = models.Customer(
        phone_number=phone_number,
        total_points=initial_points,
        referral_code=generate_referral_code()
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return {
        "phone_number": customer.phone_number,
        "total_points": customer.total_points,
        "referral_code": customer.referral_code
    }
