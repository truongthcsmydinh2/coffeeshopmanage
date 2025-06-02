from fastapi import APIRouter
from app.api.v1.endpoints import orders

api_router = APIRouter()

# Thêm các router từ các endpoints
api_router.include_router(orders.router, prefix="/orders", tags=["orders"]) 