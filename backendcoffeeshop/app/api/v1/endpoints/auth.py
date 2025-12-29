from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class AdminLoginRequest(BaseModel):
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    message: str
    token: str = None

@router.post("/admin-login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest) -> AdminLoginResponse:
    """
    Endpoint xác thực admin với mật khẩu cố định
    """
    # Mật khẩu cố định
    ADMIN_PASSWORD = "266600"
    
    if request.password == ADMIN_PASSWORD:
        return AdminLoginResponse(
            success=True,
            message="Đăng nhập thành công",
            token="admin_authenticated"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không đúng"
        )