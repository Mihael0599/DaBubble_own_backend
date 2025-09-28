from typing import Optional
from fastapi import HTTPException, Depends, Header
from jose import jwt, JWTError
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from sqlmodel import Session, select
from .db import get_session
from .models import User


JWT_SECRET = "change-me"         # später aus ENV lesen
JWT_ALG = "HS256"
JWT_MINUTES = 60 * 24 * 7        # 7 Tage

def hash_password(plain: str) -> str:
    return bcrypt.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.verify(plain, hashed)

def create_access_token(user_id: int) -> str:
    now = datetime.utcnow()
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=JWT_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def get_current_user(authorization: str | None = Header(None), session: Session = Depends(get_session)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(data["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid token")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user
