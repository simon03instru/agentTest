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
def update_role(
    user_id: int,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["superadmin"])),
):
    allowed_roles = ["user", "admin", "superadmin"]

    if payload.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Role tidak valid")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    user.role = payload.role
    db.commit()

    return {
        "message": "Role berhasil diubah",
        "user_id": user.id,
        "new_role": user.role,
    }


@router.patch("/{user_id}/active")
def update_active_status(
    user_id: int,
    payload: UpdateActiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if user.role == "superadmin" and current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Admin tidak boleh menonaktifkan superadmin",
        )

    user.is_active = payload.is_active
    db.commit()

    return {
        "message": "Status user berhasil diubah",
        "user_id": user.id,
        "is_active": user.is_active,
    }