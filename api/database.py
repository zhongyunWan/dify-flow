"""
内存数据库 - 使用字典存储数据
"""
from datetime import datetime
from typing import Optional
import uuid


class InMemoryDB:
    """内存数据库"""

    def __init__(self):
        self.workflows: dict = {}
        self.executions: dict = {}
        self.node_executions: dict = {}

    def generate_id(self, prefix: str = "") -> str:
        """生成唯一ID"""
        return f"{prefix}{uuid.uuid4().hex[:12]}"


# 全局数据库实例
db = InMemoryDB()


# 数据模型类
class Workflow:
    """工作流模型"""

    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        graph: dict,
        version: int = 1,
        status: str = "draft",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.graph = graph
        self.version = version
        self.status = status
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()


class Execution:
    """执行记录模型"""

    def __init__(
        self,
        id: str,
        workflow_id: str,
        status: str = "pending",
        inputs: Optional[dict] = None,
        outputs: Optional[dict] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
    ):
        self.id = id
        self.workflow_id = workflow_id
        self.status = status
        self.inputs = inputs or {}
        self.outputs = outputs or {}
        self.node_executions = []
        self.started_at = started_at
        self.finished_at = finished_at


class NodeExecution:
    """节点执行记录模型"""

    def __init__(
        self,
        execution_id: str,
        node_id: str,
        status: str = "pending",
        input: Optional[dict] = None,
        output: Optional[dict] = None,
        error: Optional[str] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
    ):
        self.execution_id = execution_id
        self.node_id = node_id
        self.status = status
        self.input = input or {}
        self.output = output or {}
        self.error = error
        self.started_at = started_at
        self.finished_at = finished_at

    @property
    def duration(self) -> Optional[float]:
        """计算执行时长（秒）"""
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None
