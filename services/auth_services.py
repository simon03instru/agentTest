from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
import os

from models.users import User
from schemas.auth_schemas import RegisterRequest, LoginRequest
from auth.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
)

FRONTEND_RESET_URL = os.getenv(
    "FRONTEND_RESET_URL"
)


def register_user(db: Session, payload: RegisterRequest):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")

    user = User(
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="user",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def login_user(db: Session, payload: LoginRequest):
    user = db.query(User).filter(
        or_(
            User.username == payload.username_or_email,
            User.email == payload.username_or_email,
        )
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/email atau password salah",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif",
        )

    token = create_access_token({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    })

    return token, user


def create_forgot_password_token(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    token = generate_reset_token()

    user.reset_token = token
    user.reset_token_expired_at = datetime.utcnow() + timedelta(minutes=30)

    db.commit()

    return f"{FRONTEND_RESET_URL}?token={token}"


def reset_user_password(db: Session, token: str, new_password: str):
    user = db.query(User).filter(User.reset_token == token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token reset tidak valid")

    if not user.reset_token_expired_at:
        raise HTTPException(status_code=400, detail="Token reset tidak valid")

    if user.reset_token_expired_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token reset sudah expired")

    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expired_at = None

    db.commit()

    return True