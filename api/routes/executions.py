"""
执行控制路由
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import Execution, NodeExecution, db
from schemas import (
    ExecutionDetailResponse,
    ExecutionListResponse,
    ExecutionResponse,
    NodeExecutionDetailResponse,
    NodeExecutionItem,
)

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("/{execution_id}", response_model=ExecutionDetailResponse)
async def get_execution(execution_id: str):
    """获取执行详情和状态"""
    execution = db.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    node_executions = [
        NodeExecutionItem(
            node_id=ne.get("node_id", ""),
            node_type=ne.get("node_type"),
            status=ne.get("status", ""),
            input=ne.get("input"),
            output=ne.get("output", {}),
            error=ne.get("error"),
        )
        for ne in execution.node_executions
    ]

    return ExecutionDetailResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        inputs=execution.inputs,
        outputs=execution.outputs,
        node_executions=node_executions,
        started_at=execution.started_at,
        finished_at=execution.finished_at,
    )


@router.post("/{execution_id}/cancel", response_model=ExecutionResponse)
async def cancel_execution(execution_id: str):
    """取消正在执行的工作流"""
    execution = db.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    if execution.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel execution with status: {execution.status}",
        )

    execution.status = "cancelled"
    execution.finished_at = datetime.utcnow()

    return ExecutionResponse(
        execution_id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        started_at=execution.started_at,
    )


@router.get("/{execution_id}/nodes/{node_id}", response_model=NodeExecutionDetailResponse)
async def get_node_execution(execution_id: str, node_id: str):
    """获取特定节点的执行详情"""
    execution = db.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # 查找节点执行记录
    node_exec = None
    for ne in execution.node_executions:
        if ne.get("node_id") == node_id:
            node_exec = ne
            break

    if not node_exec:
        raise HTTPException(status_code=404, detail="Node execution not found")

    return NodeExecutionDetailResponse(
        node_id=node_exec.get("node_id", ""),
        status=node_exec.get("status", ""),
        input=node_exec.get("input", {}),
        output=node_exec.get("output", {}),
        error=node_exec.get("error"),
        started_at=node_exec.get("started_at"),
        finished_at=node_exec.get("finished_at"),
        duration=node_exec.get("duration"),
    )


@router.post("/{execution_id}/nodes/{node_id}/retry", response_model=NodeExecutionDetailResponse)
async def retry_node_execution(execution_id: str, node_id: str):
    """重试失败的节点"""
    execution = db.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # 查找节点执行记录
    node_exec = None
    for ne in execution.node_executions:
        if ne.get("node_id") == node_id:
            node_exec = ne
            break

    if not node_exec:
        raise HTTPException(status_code=404, detail="Node execution not found")

    if node_exec.get("status") != "failed":
        raise HTTPException(
            status_code=400,
            detail="Only failed nodes can be retried",
        )

    # 重新执行节点（模拟）
    node_exec["status"] = "completed"
    node_exec["output"] = {"result": f"Node {node_id} retried successfully"}

    return NodeExecutionDetailResponse(
        node_id=node_id,
        status="completed",
        input=node_exec.get("input", {}),
        output=node_exec.get("output", {}),
        error=None,
    )
