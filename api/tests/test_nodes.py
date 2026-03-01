"""
节点类型测试
"""
import pytest


class TestNodeTypes:
    """节点类型获取测试"""

    def test_get_all_node_types(self, client):
        """测试获取所有节点类型"""
        response = client.get("/api/v1/nodes/types")

        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert len(data["types"]) > 0

    def test_node_types_contain_required_fields(self, client):
        """测试节点类型包含必需字段"""
        response = client.get("/api/v1/nodes/types")

        assert response.status_code == 200
        data = response.json()
        node_type = data["types"][0]

        assert "type" in node_type
        assert "category" in node_type
        assert "label" in node_type
        assert "description" in node_type

    def test_get_specific_node_type_config(self, client):
        """测试获取特定节点类型的配置"""
        response = client.get("/api/v1/nodes/inference_node/config")

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "inference_node"
        assert "config_schema" in data

    def test_get_node_type_config_not_found(self, client):
        """测试获取不存在的节点类型配置（负向）"""
        response = client.get("/api/v1/nodes/unknown_type/config")

        assert response.status_code == 404
        assert response.json()["detail"] == "Node type not found"

    def test_all_node_types_have_unique_type(self, client):
        """测试所有节点类型有不同的 type"""
        response = client.get("/api/v1/nodes/types")

        data = response.json()
        types = [node["type"] for node in data["types"]]
        assert len(types) == len(set(types))

    def test_node_type_categories(self, client):
        """测试节点类型分类"""
        response = client.get("/api/v1/nodes/types")

        data = response.json()
        categories = {node["type"]: node["category"] for node in data["types"]}

        assert categories["train_node"] == "training"
        assert categories["inference_node"] == "inference"
        assert categories["data_node"] == "data"
        assert categories["condition_node"] == "control"


class TestNodeConfigSchema:
    """节点配置 Schema 测试"""

    def test_inference_node_has_required_fields(self, client):
        """测试推理节点有必需的配置字段"""
        response = client.get("/api/v1/nodes/inference_node/config")

        assert response.status_code == 200
        data = response.json()
        config_schema = data["config_schema"]

        assert "model_id" in config_schema
        assert config_schema["model_id"]["required"] is True

    def test_train_node_config_schema(self, client):
        """测试训练节点配置"""
        response = client.get("/api/v1/nodes/train_node/config")

        assert response.status_code == 200
        data = response.json()
        config_schema = data["config_schema"]

        assert "model_name" in config_schema
        assert "dataset_id" in config_schema
        assert config_schema["model_name"]["required"] is True

    def test_deploy_node_config_schema(self, client):
        """测试部署节点配置"""
        response = client.get("/api/v1/nodes/deploy_node/config")

        assert response.status_code == 200
        data = response.json()
        config_schema = data["config_schema"]

        assert "endpoint" in config_schema
        assert config_schema["endpoint"]["required"] is True
