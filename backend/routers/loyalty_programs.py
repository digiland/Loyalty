from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, auth, crud_loyalty_programs
from database import get_db
from typing import List, Optional
from auth import oauth2_scheme
from jose import JWTError, jwt
from pydantic import constr
import re

router = APIRouter(
    prefix="/loyalty-programs",
    tags=["loyalty-programs"],
)

# Authentication helper function
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

# Create a new loyalty program
@router.post("/", response_model=schemas.LoyaltyProgram)
def create_loyalty_program(
    program: schemas.LoyaltyProgramCreate,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Verify business is creating for itself
    if program.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create program for this business"
        )
    
    return crud_loyalty_programs.create_loyalty_program(db, program)

# Get all loyalty programs for a business
@router.get("/business/{business_id}", response_model=List[schemas.LoyaltyProgram])
def get_business_loyalty_programs(
    business_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Verify business is requesting its own programs
    if business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view programs for this business"
        )
    
    return crud_loyalty_programs.get_business_loyalty_programs(db, business_id)

# Get a specific loyalty program
@router.get("/{program_id}", response_model=schemas.LoyaltyProgram)
def get_loyalty_program(
    program_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    program = crud_loyalty_programs.get_loyalty_program(db, program_id)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loyalty program not found"
        )
    return program

# Update a loyalty program
@router.put("/{program_id}", response_model=schemas.LoyaltyProgram)
def update_loyalty_program(
    program_id: int = Path(..., gt=0),
    program_update: schemas.LoyaltyProgramBase = None,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Check program exists
    existing_program = crud_loyalty_programs.get_loyalty_program(db, program_id)
    if not existing_program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loyalty program not found"
        )
    
    # Verify business owns the program
    if existing_program.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this program"
        )
    
    updated_program = crud_loyalty_programs.update_loyalty_program(db, program_id, program_update)
    return updated_program

# Delete a loyalty program
@router.delete("/{program_id}", response_model=schemas.LoyaltyProgram)
def delete_loyalty_program(
    program_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Check program exists
    existing_program = crud_loyalty_programs.get_loyalty_program(db, program_id)
    if not existing_program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loyalty program not found"
        )
    
    # Verify business owns the program
    if existing_program.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this program"
        )
    
    deleted_program = crud_loyalty_programs.delete_loyalty_program(db, program_id)
    return deleted_program

# Process a transaction with a loyalty program
@router.post("/transaction", response_model=schemas.Transaction)
def process_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Verify business owns the transaction
    if transaction.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process transactions for this business"
        )
    
    # Validate loyalty program if provided
    if transaction.loyalty_program_id:
        program = crud_loyalty_programs.get_loyalty_program(db, transaction.loyalty_program_id)
        if not program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loyalty program not found"
            )
        # Check program belongs to the business
        if program.business_id != current_business.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to use this loyalty program"
            )
    
    try:
        return crud_loyalty_programs.process_transaction(db, transaction)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Process a referral
@router.post("/referral", response_model=schemas.Referral)
def process_referral(
    referral: schemas.ReferralCreate,
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Verify business owns the referral
    if referral.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process referrals for this business"
        )
    
    # Validate phone numbers
    if referral.referrer_phone_number == referral.referred_phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer cannot refer themselves"
        )
    
    # Process the referral
    result = crud_loyalty_programs.process_referral(db, referral)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process referral"
        )
    
    return result

# Enroll a customer in a paid membership
@router.post("/paid-membership/{program_id}/enroll", response_model=schemas.CustomerMembership)
def enroll_in_paid_membership(
    program_id: int = Path(..., gt=0),
    customer_phone_number: str = Query(..., min_length=9, max_length=15),
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Validate the program
    program = crud_loyalty_programs.get_loyalty_program(db, program_id)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loyalty program not found"
        )
    
    # Check program belongs to the business
    if program.business_id != current_business.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to enroll customers in this program"
        )
    
    # Check program type
    if program.program_type != schemas.LoyaltyProgramType.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a paid membership program"
        )
    
    # Find or create customer
    customer = db.query(models.Customer).filter(models.Customer.phone_number == customer_phone_number).first()
    if not customer:
        customer = models.Customer(phone_number=customer_phone_number, total_points=0)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    # Enroll customer
    membership = crud_loyalty_programs.enroll_in_paid_membership(db, customer.id, program_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to enroll customer in paid membership"
        )
    
    return membership

# Get a customer's memberships
@router.get("/customer/{phone_number}/memberships", response_model=List[schemas.CustomerMembership])
def get_customer_memberships(
    phone_number: str = Path(..., min_length=9, max_length=15),
    db: Session = Depends(get_db),
    current_business: schemas.Business = Depends(get_current_business)
):
    # Find the customer
    customer = db.query(models.Customer).filter(models.Customer.phone_number == phone_number).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Get memberships for programs belonging to this business
    memberships = db.query(models.CustomerMembership).join(
        models.LoyaltyProgram,
        models.CustomerMembership.loyalty_program_id == models.LoyaltyProgram.id
    ).filter(
        models.CustomerMembership.customer_id == customer.id,
        models.LoyaltyProgram.business_id == current_business.id
    ).all()
    
    return memberships
