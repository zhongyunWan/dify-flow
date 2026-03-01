"""
pytest 配置和 fixtures
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from database import db


@pytest.fixture
def client():
    """创建测试客户端"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_db():
    """每个测试前清空数据库"""
    db.workflows.clear()
    db.executions.clear()
    db.node_executions.clear()
    yield
    db.workflows.clear()
    db.executions.clear()
    db.node_executions.clear()


@pytest.fixture
def sample_workflow_data():
    """样例工作流数据"""
    return {
        "name": "测试工作流",
        "description": "这是一个测试工作流",
        "graph": {
            "nodes": [
                {
                    "id": "node_1",
                    "type": "data_node",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "数据输入", "config": {"source": "user"}},
                },
                {
                    "id": "node_2",
                    "type": "inference_node",
                    "position": {"x": 300, "y": 100},
                    "data": {"label": "推理", "config": {"model_id": "gpt-4"}},
                },
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "node_1",
                    "target": "node_2",
                }
            ],
        },
    }


@pytest.fixture
def created_workflow(client, sample_workflow_data):
    """创建一个已保存的工作流"""
    response = client.post("/api/v1/workflows", json=sample_workflow_data)
    return response.json()
