"""
Pydantic 数据模型 - 请求和响应
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# === 工作流相关模型 ===

class NodeData(BaseModel):
    """节点数据"""
    label: str
    config: Dict[str, Any] = Field(default_factory=dict)


class Node(BaseModel):
    """节点"""
    id: str
    type: str
    position: Dict[str, float]
    data: NodeData


class Edge(BaseModel):
    """连线"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class Graph(BaseModel):
    """工作流图"""
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)


class WorkflowCreate(BaseModel):
    """创建工作流请求"""
    name: str = Field(..., min_length=1)
    description: str = ""
    graph: Graph = Field(default_factory=Graph)


class WorkflowUpdate(BaseModel):
    """更新工作流请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[Graph] = None


class WorkflowResponse(BaseModel):
    """工作流响应"""
    id: str
    name: str
    description: str
    graph: Dict[str, Any]
    version: int
    status: str
    created_at: datetime
    updated_at: datetime


class WorkflowListItem(BaseModel):
    """工作流列表项"""
    id: str
    name: str
    description: str
    version: int
    status: str
    created_at: datetime
    updated_at: datetime


class WorkflowListResponse(BaseModel):
    """工作流列表响应"""
    items: List[WorkflowListItem]
    total: int
    page: int
    page_size: int


class WorkflowPublishResponse(BaseModel):
    """工作流发布响应"""
    id: str
    status: str
    version: int


# === 节点类型相关模型 ===

class ConfigSchemaField(BaseModel):
    """配置schema字段"""
    type: str
    required: bool = False
    default: Any = None


class NodeType(BaseModel):
    """节点类型"""
    type: str
    category: str
    label: str
    description: str
    icon: str
    config_schema: Optional[Dict[str, ConfigSchemaField]] = None


class NodeTypesResponse(BaseModel):
    """节点类型列表响应"""
    types: List[NodeType]


class NodeConfigResponse(BaseModel):
    """节点配置响应"""
    type: str
    config_schema: Dict[str, ConfigSchemaField]


# === 执行相关模型 ===

class WorkflowRunRequest(BaseModel):
    """执行工作流请求"""
    inputs: Dict[str, Any] = Field(default_factory=dict)
    execution_mode: str = "sync"


class ExecutionResponse(BaseModel):
    """执行响应"""
    execution_id: str
    workflow_id: str
    status: str
    started_at: Optional[datetime] = None


class NodeExecutionItem(BaseModel):
    """节点执行项"""
    node_id: str
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    output: Dict[str, Any] = Field(default_factory=dict)


class ExecutionDetailResponse(BaseModel):
    """执行详情响应"""
    id: str
    workflow_id: str
    status: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    node_executions: List[NodeExecutionItem]
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class NodeExecutionDetailResponse(BaseModel):
    """节点执行详情响应"""
    node_id: str
    status: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    duration: Optional[float] = None


class ExecutionListResponse(BaseModel):
    """执行列表响应"""
    items: List[ExecutionResponse]
    total: int
    page: int
    page_size: int


# === 错误响应 ===

class ErrorDetail(BaseModel):
    """错误详情"""
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


# === 健康检查 ===

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str


class APIInfoResponse(BaseModel):
    """API信息响应"""
    name: str
    version: str
    description: str
