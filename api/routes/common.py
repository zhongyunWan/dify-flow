"""
公共API路由
"""
from fastapi import APIRouter

from schemas import APIInfoResponse, HealthResponse

router = APIRouter(tags=["common"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(status="ok")


@router.get("/", response_model=APIInfoResponse)
async def root():
    """API信息"""
    return APIInfoResponse(
        name="Dify Workflow API",
        version="1.0.0",
        description="大模型工作流编排应用 API",
    )
