from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from models.admin_model import Admin
from configs.db import get_session
from utils.token import create_token
from schemas.admin_schema import LoginRequest


router = APIRouter(prefix="/admin", tags=["Admin"])

#login /login
@router.post("/")
def login(payload: LoginRequest,session: Session = Depends(get_session),):
    admin = session.exec(select(Admin).where(Admin.email == payload.email)
    ).first()

    if not admin:
        return{"error": "Invalid Email"}
    if admin.password != payload.password:
        return {"error": "Invalid Password"}

    token = create_token({
        "user_id": str(admin.id),
        "email": admin.email,
        "role": admin.role,
    })

    return {
        "access_token": token
    }