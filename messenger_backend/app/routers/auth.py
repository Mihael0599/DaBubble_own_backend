from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from ..db import get_session
from ..models import User
from ..security import hash_password, verify_password, create_access_token

router = APIRouter()

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, session: Session = Depends(get_session)):
    exists = session.exec(select(User).where(User.email == payload.email)).first()
    if exists:
        raise HTTPException(400, "User already exists")
    user = User(email=payload.email, display_name=payload.display_name,
                password_hash=hash_password(payload.password))
    session.add(user); session.commit(); session.refresh(user)
    if user.id is None:
        raise HTTPException(500, "User ID is missing")
    return {"access_token": create_access_token(user.id)}

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if user.id is None:
        raise HTTPException(500, "User ID is missing")
    return {"access_token": create_access_token(user.id)}
