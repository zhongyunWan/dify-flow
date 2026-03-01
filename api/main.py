"""
FastAPI 应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import common, executions, nodes, workflows

# 创建 FastAPI 应用
app = FastAPI(
    title="QS2 Workflow API",
    description="大模型工作流编排应用 API",
    version="1.0.0",
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(common.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")
app.include_router(nodes.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
