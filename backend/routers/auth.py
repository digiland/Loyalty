from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login_business")

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

@router.post("/register_business", response_model=schemas.Business)
def register_business(business: schemas.BusinessCreate, db: Session = Depends(get_db)):
    db_business = crud.get_business_by_email(db, email=business.email)
    if db_business:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(business.password)
    return crud.create_business(db=db, business=business, hashed_password=hashed_password)

@router.post("/login_business", response_model=schemas.Token)
def login_business(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    business = crud.get_business_by_email(db, email=form_data.username)
    if not business or not auth.verify_password(form_data.password, business.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = auth.create_access_token(data={"sub": business.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.Business)
def read_me(current_business: schemas.Business = Depends(get_current_business)):
    return current_business
