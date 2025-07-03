from sqlalchemy.orm import Session
import models, schemas

def get_business_by_email(db: Session, email: str):
    return db.query(models.Business).filter(models.Business.email == email).first()

def create_business(db: Session, business: schemas.BusinessCreate, hashed_password: str):
    db_business = models.Business(
        name=business.name,
        contact_person=business.contact_person,
        email=business.email,
        password_hash=hashed_password,
        loyalty_rate=business.loyalty_rate
    )
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

def set_loyalty_rate(db: Session, business_id: int, loyalty_rate: float):
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise Exception("Business not found")
    business.loyalty_rate = loyalty_rate
    db.commit()
    db.refresh(business)
    return business

def add_points(db: Session, transaction: 'schemas.TransactionCreate'):
    business = db.query(models.Business).filter(models.Business.id == transaction.business_id).first()
    if not business:
        raise Exception("Business not found")
    customer = db.query(models.Customer).filter(models.Customer.phone_number == transaction.customer_phone_number).first()
    if not customer:
        customer = models.Customer(phone_number=transaction.customer_phone_number, total_points=0)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    points_earned = int(transaction.amount_spent * business.loyalty_rate)
    customer.total_points += points_earned
    db.commit()
    db.refresh(customer)
    db_transaction = models.Transaction(
        business_id=business.id,
        customer_id=customer.id,
        amount_spent=transaction.amount_spent,
        points_earned=points_earned
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def redeem_points(db: Session, redemption: 'schemas.RedemptionCreate'):
    business = db.query(models.Business).filter(models.Business.id == redemption.business_id).first()
    if not business:
        raise Exception("Business not found")
    
    customer = db.query(models.Customer).filter(models.Customer.phone_number == redemption.customer_phone_number).first()
    if not customer:
        raise Exception("Customer not found")
    
    # Check if customer has enough points
    if customer.total_points < redemption.points_to_redeem:
        raise Exception(f"Not enough points. Customer has {customer.total_points} points, but {redemption.points_to_redeem} were requested.")
    
    # Deduct points
    customer.total_points -= redemption.points_to_redeem
    db.commit()
    db.refresh(customer)
    
    # Record redemption transaction
    db_transaction = models.Transaction(
        business_id=business.id,
        customer_id=customer.id,
        amount_spent=0,  # No amount spent on redemption
        points_earned=-redemption.points_to_redeem,  # Negative points for redemption
        transaction_type=models.TransactionType.REDEMPTION,
        reward_description=redemption.reward_description
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

def get_customer_points(db: Session, phone_number: str):
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        raise Exception("Customer not found")
    transactions = db.query(models.Transaction).filter(models.Transaction.customer_id == customer.id).order_by(models.Transaction.timestamp.desc()).limit(5).all()
    business_map = {b.id: b.name for b in db.query(models.Business).all()}
    recent_transactions = [
        {
            "business_name": business_map.get(t.business_id, "Unknown"),
            "points_earned": t.points_earned,
            "amount_spent": t.amount_spent,
            "transaction_type": t.transaction_type,
            "reward_description": t.reward_description if t.transaction_type == models.TransactionType.REDEMPTION else None,
            "timestamp": t.timestamp
        }
        for t in transactions
    ]
    return {
        "total_points": customer.total_points,
        "recent_transactions": recent_transactions
    }
