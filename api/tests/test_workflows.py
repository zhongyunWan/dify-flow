"""
工作流 CRUD 测试
"""
import pytest


class TestWorkflowCreate:
    """工作流创建测试"""

    def test_create_workflow_success(self, client, sample_workflow_data):
        """测试成功创建工作流"""
        response = client.post("/api/v1/workflows", json=sample_workflow_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_workflow_data["name"]
        assert data["description"] == sample_workflow_data["description"]
        assert data["status"] == "draft"
        assert data["version"] == 1
        assert "id" in data

    def test_create_workflow_minimal(self, client):
        """测试创建最小工作流（仅名称）"""
        response = client.post("/api/v1/workflows", json={"name": "最小工作流"})

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "最小工作流"
        assert data["description"] == ""
        assert data["graph"] == {"nodes": [], "edges": []}

    def test_create_workflow_empty_name(self, client):
        """测试创建工作流 - 空名称被拒绝"""
        response = client.post("/api/v1/workflows", json={"name": ""})

        # Pydantic v2 会验证必填字段，空字符串被拒绝
        assert response.status_code == 422

    def test_create_workflow_without_name(self, client):
        """测试创建工作流 - 无名称（负向）"""
        response = client.post("/api/v1/workflows", json={})

        assert response.status_code == 422


class TestWorkflowList:
    """工作流列表测试"""

    def test_list_empty_workflows(self, client):
        """测试空工作流列表"""
        response = client.get("/api/v1/workflows")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_workflows_with_items(self, client, created_workflow):
        """测试获取工作流列表"""
        response = client.get("/api/v1/workflows")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1

    def test_list_workflows_pagination(self, client, sample_workflow_data):
        """测试分页功能"""
        # 创建多个工作流
        for i in range(25):
            client.post("/api/v1/workflows", json={"name": f"工作流 {i}"})

        response = client.get("/api/v1/workflows?page=1&page_size=10")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 25
        assert len(data["items"]) == 10
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_list_workflows_filter_by_status(self, client, created_workflow, sample_workflow_data):
        """测试按状态过滤"""
        # 创建一个已发布的工作流
        workflow_id = created_workflow["id"]
        client.post(f"/api/v1/workflows/{workflow_id}/publish")

        # 创建草稿状态的工作流
        client.post("/api/v1/workflows", json={"name": "草稿工作流"})

        # 按 published 过滤
        response = client.get("/api/v1/workflows?status=published")
        data = response.json()
        assert data["total"] == 1

        # 按 draft 过滤
        response = client.get("/api/v1/workflows?status=draft")
        data = response.json()
        assert data["total"] == 1


class TestWorkflowGet:
    """工作流获取测试"""

    def test_get_workflow_success(self, client, created_workflow):
        """测试成功获取工作流"""
        workflow_id = created_workflow["id"]
        response = client.get(f"/api/v1/workflows/{workflow_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workflow_id
        assert data["name"] == created_workflow["name"]

    def test_get_workflow_not_found(self, client):
        """测试获取不存在的工作流（负向）"""
        response = client.get("/api/v1/workflows/nonexistent_id")

        assert response.status_code == 404
        assert response.json()["detail"] == "Workflow not found"


class TestWorkflowUpdate:
    """工作流更新测试"""

    def test_update_workflow_name(self, client, created_workflow):
        """测试更新工作流名称"""
        workflow_id = created_workflow["id"]
        response = client.put(
            f"/api/v1/workflows/{workflow_id}",
            json={"name": "更新后的名称"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新后的名称"

    def test_update_workflow_description(self, client, created_workflow):
        """测试更新工作流描述"""
        workflow_id = created_workflow["id"]
        response = client.put(
            f"/api/v1/workflows/{workflow_id}",
            json={"description": "新的描述"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "新的描述"

    def test_update_workflow_graph(self, client, created_workflow):
        """测试更新工作流图"""
        workflow_id = created_workflow["id"]
        new_graph = {
            "nodes": [
                {
                    "id": "new_node",
                    "type": "data_node",
                    "position": {"x": 0, "y": 0},
                    "data": {"label": "新节点"},
                }
            ],
            "edges": [],
        }
        response = client.put(
            f"/api/v1/workflows/{workflow_id}",
            json={"graph": new_graph},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["graph"]["nodes"]) == 1

    def test_update_workflow_not_found(self, client):
        """测试更新不存在的工作流（负向）"""
        response = client.put(
            "/api/v1/workflows/nonexistent_id",
            json={"name": "新名称"},
        )

        assert response.status_code == 404

    def test_update_workflow_partial(self, client, created_workflow):
        """测试部分更新工作流"""
        workflow_id = created_workflow["id"]
        original_name = created_workflow["name"]
        original_description = created_workflow["description"]

        # 只更新名称
        response = client.put(
            f"/api/v1/workflows/{workflow_id}",
            json={"name": "仅更新名称"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "仅更新名称"
        assert data["description"] == original_description


class TestWorkflowDelete:
    """工作流删除测试"""

    def test_delete_workflow_success(self, client, created_workflow):
        """测试成功删除工作流"""
        workflow_id = created_workflow["id"]
        response = client.delete(f"/api/v1/workflows/{workflow_id}")

        assert response.status_code == 204

        # 验证已删除
        get_response = client.get(f"/api/v1/workflows/{workflow_id}")
        assert get_response.status_code == 404

    def test_delete_workflow_not_found(self, client):
        """测试删除不存在的工作流（负向）"""
        response = client.delete("/api/v1/workflows/nonexistent_id")

        assert response.status_code == 404


class TestWorkflowPublish:
    """工作流发布测试"""

    def test_publish_workflow_success(self, client, created_workflow):
        """测试成功发布工作流"""
        workflow_id = created_workflow["id"]
        response = client.post(f"/api/v1/workflows/{workflow_id}/publish")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "published"
        assert data["version"] == 2  # 发布后版本+1

    def test_publish_workflow_not_found(self, client):
        """测试发布不存在的工作流（负向）"""
        response = client.post("/api/v1/workflows/nonexistent_id/publish")

        assert response.status_code == 404

    def test_publish_multiple_times(self, client, created_workflow):
        """测试多次发布"""
        workflow_id = created_workflow["id"]

        # 第一次发布
        response = client.post(f"/api/v1/workflows/{workflow_id}/publish")
        assert response.json()["version"] == 2

        # 第二次发布
        response = client.post(f"/api/v1/workflows/{workflow_id}/publish")
        assert response.json()["version"] == 3
