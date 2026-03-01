"""
工作流管理路由
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import Execution, Workflow, db
from schemas import (
    ExecutionListResponse,
    ExecutionResponse,
    Graph,
    WorkflowCreate,
    WorkflowListItem,
    WorkflowListResponse,
    WorkflowPublishResponse,
    WorkflowResponse,
    WorkflowUpdate,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(workflow: WorkflowCreate):
    """创建工作流"""
    workflow_id = db.generate_id("workflow_")

    # 转换graph为字典
    graph_dict = {}
    if workflow.graph:
        graph_dict = {
            "nodes": [node.model_dump() for node in workflow.graph.nodes],
            "edges": [edge.model_dump() for edge in workflow.graph.edges],
        }

    new_workflow = Workflow(
        id=workflow_id,
        name=workflow.name,
        description=workflow.description,
        graph=graph_dict,
    )

    db.workflows[workflow_id] = new_workflow

    return WorkflowResponse(
        id=new_workflow.id,
        name=new_workflow.name,
        description=new_workflow.description,
        graph=new_workflow.graph,
        version=new_workflow.version,
        status=new_workflow.status,
        created_at=new_workflow.created_at,
        updated_at=new_workflow.updated_at,
    )


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
):
    """获取工作流列表"""
    workflows = list(db.workflows.values())

    # 状态过滤
    if status:
        workflows = [w for w in workflows if w.status == status]

    total = len(workflows)

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    workflows_page = workflows[start:end]

    items = [
        WorkflowListItem(
            id=w.id,
            name=w.name,
            description=w.description,
            version=w.version,
            status=w.status,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )
        for w in workflows_page
    ]

    return WorkflowListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str):
    """获取单个工作流"""
    workflow = db.workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        graph=workflow.graph,
        version=workflow.version,
        status=workflow.status,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, workflow: WorkflowUpdate):
    """更新工作流"""
    existing_workflow = db.workflows.get(workflow_id)
    if not existing_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # 更新字段
    if workflow.name is not None:
        existing_workflow.name = workflow.name
    if workflow.description is not None:
        existing_workflow.description = workflow.description
    if workflow.graph is not None:
        existing_workflow.graph = {
            "nodes": [node.model_dump() for node in workflow.graph.nodes],
            "edges": [edge.model_dump() for edge in workflow.graph.edges],
        }

    existing_workflow.updated_at = datetime.utcnow()

    return WorkflowResponse(
        id=existing_workflow.id,
        name=existing_workflow.name,
        description=existing_workflow.description,
        graph=existing_workflow.graph,
        version=existing_workflow.version,
        status=existing_workflow.status,
        created_at=existing_workflow.created_at,
        updated_at=existing_workflow.updated_at,
    )


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: str):
    """删除工作流"""
    if workflow_id not in db.workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    del db.workflows[workflow_id]
    return None


@router.post("/{workflow_id}/publish", response_model=WorkflowPublishResponse)
async def publish_workflow(workflow_id: str):
    """发布工作流"""
    workflow = db.workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # 更新版本和状态
    workflow.version += 1
    workflow.status = "published"
    workflow.updated_at = datetime.utcnow()

    return WorkflowPublishResponse(
        id=workflow.id,
        status=workflow.status,
        version=workflow.version,
    )


@router.post("/{workflow_id}/run", response_model=ExecutionResponse)
async def run_workflow(workflow_id: str, request: dict):
    """执行工作流"""
    workflow = db.workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    execution_id = db.generate_id("exec_")

    execution = Execution(
        id=execution_id,
        workflow_id=workflow_id,
        status="running",
        inputs=request.get("inputs", {}),
        started_at=datetime.utcnow(),
    )

    # 模拟执行节点
    if workflow.graph and workflow.graph.get("nodes"):
        for node in workflow.graph["nodes"]:
            node_exec = {
                "node_id": node["id"],
                "status": "completed",
                "output": {"result": f"Node {node['id']} executed"},
            }
            execution.node_executions.append(node_exec)

    execution.status = "completed"
    execution.outputs = {"result": "Workflow executed successfully"}
    execution.finished_at = datetime.utcnow()

    db.executions[execution_id] = execution

    return ExecutionResponse(
        execution_id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        started_at=execution.started_at,
    )


@router.get("/{workflow_id}/executions", response_model=ExecutionListResponse)
async def list_workflow_executions(
    workflow_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
):
    """获取工作流的执行历史"""
    # 验证工作流存在
    if workflow_id not in db.workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    executions = [
        e for e in db.executions.values() if e.workflow_id == workflow_id
    ]

    # 状态过滤
    if status:
        executions = [e for e in executions if e.status == status]

    total = len(executions)

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    executions_page = executions[start:end]

    items = [
        ExecutionResponse(
            execution_id=e.id,
            workflow_id=e.workflow_id,
            status=e.status,
            started_at=e.started_at,
        )
        for e in executions_page
    ]

    return ExecutionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
