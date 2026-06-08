from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.db_connect import get_db
from models.users import User
from schemas.auth_schemas import UserResponse, UpdateRoleRequest, UpdateActiveRequest
from auth.dependencies import require_roles

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["superadmin"])),
):
    allowed_roles = ["user", "admin", "superadmin"]

    if payload.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Role tidak valid"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    # mencegah superadmin mengubah role dirinya sendiri tanpa sengaja
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Tidak boleh mengubah role akun sendiri"
        )

    user.role = payload.role
    db.commit()
    db.refresh(user)

    return {
        "message": "Role user berhasil diubah",
        "user_id": user.id,
        "username": user.username,
        "new_role": user.role
    }


@router.patch("/{user_id}/active")
def update_user_active(
    user_id: int,
    payload: UpdateActiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Tidak boleh menonaktifkan akun sendiri"
        )

    if user.role == "superadmin" and current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Admin tidak boleh mengubah status superadmin"
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    return {
        "message": "Status user berhasil diubah",
        "user_id": user.id,
        "username": user.username,
        "is_active": user.is_active
    }