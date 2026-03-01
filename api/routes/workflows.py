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

    # 验证工作流是否有节点
    if not workflow.graph or not workflow.graph.get("nodes"):
        execution.status = "failed"
        execution.outputs = {"error": "Workflow has no nodes"}
        execution.finished_at = datetime.utcnow()
        db.executions[execution_id] = execution
        raise HTTPException(status_code=400, detail="Workflow has no nodes")

    # 获取节点和边
    nodes = workflow.graph.get("nodes", [])
    edges = workflow.graph.get("edges", [])

    # 构建节点执行顺序（拓扑排序）
    execution_order = topological_sort(nodes, edges)
    if not execution_order:
        execution.status = "failed"
        execution.outputs = {"error": "Invalid workflow: circular dependency or no starting nodes"}
        execution.finished_at = datetime.utcnow()
        db.executions[execution_id] = execution
        raise HTTPException(status_code=400, detail="Invalid workflow: circular dependency or no starting nodes")

    # 创建节点映射
    node_map = {node["id"]: node for node in nodes}

    # 存储每个节点的输出，用于传递给下游节点
    node_outputs = {}

    # 依次执行节点
    for node_id in execution_order:
        node = node_map[node_id]
        node_type = node.get("type", "unknown")
        node_data = node.get("data", {})

        # 获取节点的输入（从前置节点获取）
        node_input = get_node_input(node_id, edges, node_outputs, execution.inputs)

        # 执行节点
        try:
            output = execute_node(node_type, node_data, node_input, node_id)
            node_outputs[node_id] = output

            # 记录节点执行
            execution.node_executions.append({
                "node_id": node_id,
                "node_type": node_type,
                "status": "completed",
                "input": node_input,
                "output": output,
            })
        except Exception as e:
            # 节点执行失败
            execution.node_executions.append({
                "node_id": node_id,
                "node_type": node_type,
                "status": "failed",
                "input": node_input,
                "error": str(e),
            })
            execution.status = "failed"
            execution.outputs = {"error": f"Node {node_id} failed: {str(e)}", "node_outputs": node_outputs}
            execution.finished_at = datetime.utcnow()
            db.executions[execution_id] = execution
            raise HTTPException(status_code=500, detail=f"Node {node_id} failed: {str(e)}")

    # 所有节点执行成功
    execution.status = "completed"
    execution.outputs = {
        "result": "Workflow executed successfully",
        "node_outputs": node_outputs,
    }
    execution.finished_at = datetime.utcnow()

    db.executions[execution_id] = execution

    return ExecutionResponse(
        execution_id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status,
        started_at=execution.started_at,
    )


def topological_sort(nodes: list, edges: list) -> list:
    """拓扑排序，确定节点执行顺序"""
    if not nodes:
        return []

    # 构建依赖图
    node_ids = [node["id"] for node in nodes]
    in_degree = {node_id: 0 for node_id in node_ids}
    adjacency = {node_id: [] for node_id in node_ids}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source in in_degree and target in in_degree:
            in_degree[target] += 1
            adjacency[source].append(target)

    # 找到所有入度为0的节点（起始节点）
    queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
    result = []

    while queue:
        node_id = queue.pop(0)
        result.append(node_id)

        # 更新下游节点的入度
        for neighbor in adjacency[node_id]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # 如果结果数量不等于节点数量，说明有环
    if len(result) != len(nodes):
        return []

    return result


def get_node_input(node_id: str, edges: list, node_outputs: dict, workflow_inputs: dict) -> dict:
    """获取节点的输入（从前置节点的输出或工作流输入获取）"""
    # 找到所有指向该节点的上游边
    incoming_edges = [edge for edge in edges if edge.get("target") == node_id]

    if not incoming_edges:
        # 没有前置节点，使用工作流输入
        return workflow_inputs

    # 合并所有前置节点的输出
    merged_input = {}
    for edge in incoming_edges:
        source_id = edge.get("source")
        if source_id in node_outputs:
            source_output = node_outputs[source_id]
            # 合并输出到输入
            if isinstance(source_output, dict):
                merged_input.update(source_output)
            else:
                merged_input["output"] = source_output

    return merged_input


import re


def snake_to_camel(snake_str: str) -> str:
    """将下划线命名转换为驼峰命名"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_config_keys(config: dict) -> dict:
    """将配置中的下划线键转换为驼峰键"""
    if not isinstance(config, dict):
        return config

    result = {}
    for key, value in config.items():
        # 转换键名
        camel_key = snake_to_camel(key)
        # 递归处理嵌套字典
        if isinstance(value, dict):
            result[camel_key] = convert_config_keys(value)
        else:
            result[camel_key] = value
    return result


def execute_node(node_type: str, node_data: dict, node_input: dict, node_id: str) -> dict:
    """根据节点类型执行节点"""
    # 节点配置 - 转换下划线键为驼峰键
    raw_config = node_data.get("config", {})
    config = convert_config_keys(raw_config)

    # 支持 custom 类型，从 label 推断实际类型
    if node_type == "custom":
        label = node_data.get("label", "").lower()
        if "data" in label or "数据" in label:
            node_type = "data_node"
        elif "train" in label or "训练" in label:
            node_type = "train_node"
        elif "compress" in label or "压缩" in label:
            node_type = "compress_node"
        elif "inference" in label or "推理" in label:
            node_type = "inference_node"
        elif "deploy" in label or "部署" in label:
            node_type = "deploy_node"
        elif "condition" in label or "条件" in label:
            node_type = "condition_node"

    if node_type == "data_node":
        # 数据节点：返回配置的数据或输入数据
        return execute_data_node(config, node_input)

    elif node_type == "train_node":
        # 训练节点：模拟训练过程
        return execute_train_node(config, node_input, node_id)

    elif node_type == "compress_node":
        # 压缩节点：模拟压缩过程
        return execute_compress_node(config, node_input, node_id)

    elif node_type == "inference_node":
        # 推理节点：模拟推理过程
        return execute_inference_node(config, node_input, node_id)

    elif node_type == "deploy_node":
        # 部署节点：模拟部署过程
        return execute_deploy_node(config, node_input, node_id)

    elif node_type == "condition_node":
        # 条件节点：根据条件选择分支
        return execute_condition_node(config, node_input, node_id)

    else:
        # 未知节点类型
        return {"result": f"Unknown node type: {node_type}", "status": "completed"}


def execute_data_node(config: dict, node_input: dict) -> dict:
    """执行数据节点"""
    # 数据源配置
    data_source = config.get("dataSource", "input")
    data = config.get("data", "")

    if data_source == "input":
        # 使用输入数据
        return {
            "result": "Data loaded from input",
            "data": node_input.get("data", node_input),
        }
    elif data_source == "custom":
        # 使用自定义数据
        return {
            "result": "Data loaded from custom configuration",
            "data": data,
        }
    else:
        return {
            "result": f"Data loaded from {data_source}",
            "data": node_input,
        }


def execute_train_node(config: dict, node_input: dict, node_id: str) -> dict:
    """执行训练节点"""
    # 训练配置
    model_name = config.get("modelName", "default-model")
    epochs = config.get("epochs", 10)
    learning_rate = config.get("learningRate", 0.001)
    dataset = node_input.get("data", node_input.get("dataset", ""))

    # 模拟训练过程
    return {
        "result": "Training completed",
        "model_name": model_name,
        "epochs": epochs,
        "learning_rate": learning_rate,
        "dataset": dataset,
        "metrics": {
            "accuracy": 0.95,
            "loss": 0.05,
            "val_accuracy": 0.93,
            "val_loss": 0.07,
        },
        "trained_model_path": f"/models/{node_id}_trained.pt",
    }


def execute_compress_node(config: dict, node_input: dict, node_id: str) -> dict:
    """执行压缩节点"""
    # 压缩配置
    compression_method = config.get("compressionMethod", "pruning")
    compression_ratio = config.get("compressionRatio", 0.5)

    # 获取上游模型的路径
    model_path = node_input.get("trained_model_path", "/models/default.pt")

    return {
        "result": "Compression completed",
        "method": compression_method,
        "ratio": compression_ratio,
        "original_model": model_path,
        "compressed_model_path": f"/models/{node_id}_compressed.pt",
        "original_size_mb": 100,
        "compressed_size_mb": 100 * compression_ratio,
    }


def execute_inference_node(config: dict, node_input: dict, node_id: str) -> dict:
    """执行推理节点"""
    # 推理配置
    model_path = node_input.get("compressed_model_path", node_input.get("trained_model_path", "/models/default.pt"))
    prompt = config.get("prompt", "")
    input_text = node_input.get("text", node_input.get("input", ""))

    # 模拟推理
    return {
        "result": "Inference completed",
        "model": model_path,
        "prompt": prompt,
        "input": input_text,
        "output": f"Mock inference result for: {input_text[:50]}...",
    }


def execute_deploy_node(config: dict, node_input: dict, node_id: str) -> dict:
    """执行部署节点"""
    # 部署配置
    deployment_type = config.get("deploymentType", "api")
    model_path = node_input.get("compressed_model_path", node_input.get("trained_model_path", "/models/default.pt"))

    return {
        "result": "Deployment completed",
        "deployment_type": deployment_type,
        "model": model_path,
        "endpoint": f"https://api.example.com/v1/{node_id}",
        "status": "running",
    }


def execute_condition_node(config: dict, node_input: dict, node_id: str) -> dict:
    """执行条件节点"""
    # 条件配置
    condition = config.get("condition", "always")
    threshold = config.get("threshold", 0.5)

    # 获取上游指标
    metrics = node_input.get("metrics", {})

    # 评估条件
    if condition == "always":
        result = True
        branch = "true"
    elif condition == "accuracy_threshold":
        accuracy = metrics.get("accuracy", 0)
        result = accuracy >= threshold
        branch = "true" if result else "false"
    elif condition == "loss_threshold":
        loss = metrics.get("loss", 1)
        result = loss <= threshold
        branch = "true" if result else "false"
    else:
        result = False
        branch = "false"

    return {
        "result": "Condition evaluated",
        "condition": condition,
        "threshold": threshold,
        "metrics": metrics,
        "evaluated": result,
        "branch": branch,
    }


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
