# This file is intentionally left empty to mark the directory as a Python package

from . import dashboard
from fastapi import APIRouter
from .orders import router as orders_router
from .complete_orders import router as complete_orders_router

api_router = APIRouter()

# Đăng ký các router với prefix và tags
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(complete_orders_router, prefix="/complete-orders", tags=["complete-orders"])

# Export router chính
__all__ = ["api_router"]
