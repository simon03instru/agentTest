from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.db_connect import get_db
from schemas.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from services.auth_services import (
    register_user,
    login_user,
    create_forgot_password_token,
    reset_user_password,
)
from auth.dependencies import get_current_user
from models.users import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload)

    return {
        "message": "Registrasi berhasil",
        "user_id": user.id,
        "role": user.role,
    }


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token, user = login_user(db, payload)

    return TokenResponse(
        access_token=token,
        role=user.role,
        username=user.username,
        email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    reset_link = create_forgot_password_token(db, payload.email)

    return {
        "message": "Jika email terdaftar, link reset password akan dibuat",
        "reset_link_testing": reset_link,
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    reset_user_password(db, payload.token, payload.new_password)

    return {
        "message": "Password berhasil direset"
    }