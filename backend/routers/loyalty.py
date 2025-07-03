from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, auth
from database import get_db
from fastapi.security import OAuth2PasswordBearer
from auth import oauth2_scheme
from jose import JWTError, jwt
from typing import List
from pydantic import constr
import re

router = APIRouter(
    prefix="",
    tags=["loyalty"],
)

def get_current_business(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    business = crud.get_business_by_email(db, email=email)
    if business is None:
        raise credentials_exception
    return business

def validate_phone_number(phone_number: str) -> str:
    # Zimbabwe phone number validation (basic, can be improved)
    if not re.fullmatch(r"^\+?\d{9,15}$", phone_number):
        raise HTTPException(status_code=422, detail="Invalid phone number format.")
    return phone_number

@router.post("/businesses/{business_id}/loyalty_rules", response_model=schemas.Business)
def set_loyalty_rate(
    business_id: int = Path(..., gt=0),
    loyalty_rate: float = Query(..., gt=0, le=100),
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    if business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this business")
    try:
        return crud.set_loyalty_rate(db, business_id, loyalty_rate)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/transactions/add_points", response_model=schemas.Transaction)
def add_points(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    if transaction.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to add points for this business")
    # Validate phone number and amount
    validate_phone_number(transaction.customer_phone_number)
    if transaction.amount_spent <= 0:
        raise HTTPException(status_code=422, detail="Amount spent must be positive.")
    try:
        return crud.add_points(db, transaction)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers/points/{phone_number}", response_model=schemas.CustomerPointsResponse)
def get_customer_points(
    phone_number: str = Path(..., min_length=9, max_length=15),
    db: Session = Depends(get_db)
):
    validate_phone_number(phone_number)
    try:
        return crud.get_customer_points(db, phone_number)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/transactions/redeem_points", response_model=schemas.Transaction)
def redeem_points(
    redemption: schemas.RedemptionCreate,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    if redemption.business_id != current_business.id:
        raise HTTPException(status_code=403, detail="Not authorized to redeem points for this business")
    
    # Validate phone number and points
    validate_phone_number(redemption.customer_phone_number)
    if redemption.points_to_redeem <= 0:
        raise HTTPException(status_code=422, detail="Points to redeem must be positive.")
    
    try:
        transaction = crud.redeem_points(db, redemption)
        
        # Send SMS notification (placeholder for now)
        send_sms_placeholder(
            redemption.customer_phone_number, 
            f"You have redeemed {redemption.points_to_redeem} points for: {redemption.reward_description}"
        )
        
        return transaction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Placeholder for SMS function
def send_sms_placeholder(phone_number: str, message: str):
    # Sanitize phone number for logging
    safe_number = re.sub(r'[^\d+]', '', phone_number)
    print(f"[SMS Placeholder] To: {safe_number} | Message: {message}")
    # Integrate Twilio here in production
