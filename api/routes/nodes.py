"""
节点类型路由
"""
from typing import Dict

from fastapi import APIRouter, HTTPException

from schemas import ConfigSchemaField, NodeConfigResponse, NodeType, NodeTypesResponse

router = APIRouter(prefix="/nodes", tags=["nodes"])


# 预定义的节点类型
NODE_TYPES = [
    NodeType(
        type="train_node",
        category="training",
        label="训练节点",
        description="用于模型训练",
        icon="train",
        config_schema={
            "model_name": ConfigSchemaField(type="string", required=True),
            "dataset_id": ConfigSchemaField(type="string", required=True),
            "epochs": ConfigSchemaField(type="number", default=10),
            "learning_rate": ConfigSchemaField(type="number", default=0.001),
        },
    ),
    NodeType(
        type="compress_node",
        category="compression",
        label="压缩节点",
        description="模型压缩",
        icon="compress",
        config_schema={
            "method": ConfigSchemaField(type="string", required=True),
            "ratio": ConfigSchemaField(type="number", default=0.5),
        },
    ),
    NodeType(
        type="inference_node",
        category="inference",
        label="推理节点",
        description="模型推理",
        icon="cpu",
        config_schema={
            "model_id": ConfigSchemaField(type="string", required=True),
            "temperature": ConfigSchemaField(type="number", default=0.7),
            "max_tokens": ConfigSchemaField(type="number", default=1000),
        },
    ),
    NodeType(
        type="deploy_node",
        category="deployment",
        label="部署节点",
        description="模型部署",
        icon="cloud",
        config_schema={
            "endpoint": ConfigSchemaField(type="string", required=True),
            "replicas": ConfigSchemaField(type="number", default=1),
        },
    ),
    NodeType(
        type="data_node",
        category="data",
        label="数据节点",
        description="数据输入输出",
        icon="database",
        config_schema={
            "source": ConfigSchemaField(type="string", required=True),
            "format": ConfigSchemaField(type="string", default="json"),
        },
    ),
    NodeType(
        type="condition_node",
        category="control",
        label="条件节点",
        description="条件分支",
        icon="git-branch",
        config_schema={
            "condition": ConfigSchemaField(type="string", required=True),
        },
    ),
]


@router.get("/types", response_model=NodeTypesResponse)
async def get_node_types():
    """获取支持的节点类型"""
    return NodeTypesResponse(types=NODE_TYPES)


@router.get("/{node_type}/config", response_model=NodeConfigResponse)
async def get_node_config(node_type: str):
    """获取节点配置Schema"""
    for node_type_obj in NODE_TYPES:
        if node_type_obj.type == node_type:
            return NodeConfigResponse(
                type=node_type,
                config_schema=node_type_obj.config_schema or {},
            )

    raise HTTPException(status_code=404, detail="Node type not found")
