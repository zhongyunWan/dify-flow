# 大模型工作流编排应用 - API 接口规范

## 概述
本规范定义了 MVP 版本的 RESTful API 接口，用于支持大模型训练、压缩、推理、部署的可视化工作流编排。

## 基础信息
- 基础路径: `/api/v1`
- 认证方式: Bearer Token
- 响应格式: JSON
- 编码: UTF-8

---

## 1. 工作流管理 API

### 1.1 创建工作流
- **Endpoint**: `POST /workflows`
- **描述**: 创建新的工作流
- **请求体**:
```json
{
  "name": "string",
  "description": "string",
  "graph": {
    "nodes": [
      {
        "id": "node_1",
        "type": "train_node",
        "position": { "x": 0, "y": 0 },
        "data": {
          "label": "训练节点",
          "config": {}
        }
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "node_2",
        "sourceHandle": "output",
        "targetHandle": "input"
      }
    ]
  }
}
```
- **响应** (201 Created):
```json
{
  "id": "workflow_abc123",
  "name": "string",
  "description": "string",
  "graph": {},
  "version": 1,
  "status": "draft",
  "created_at": "2026-03-01T00:00:00Z",
  "updated_at": "2026-03-01T00:00:00Z"
}
```

### 1.2 获取工作流列表
- **Endpoint**: `GET /workflows`
- **描述**: 获取所有工作流列表
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `page_size`: 每页数量 (默认: 20)
  - `status`: 状态过滤 (draft/running/completed/failed)
- **响应** (200 OK):
```json
{
  "items": [
    {
      "id": "workflow_abc123",
      "name": "string",
      "description": "string",
      "version": 1,
      "status": "draft",
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

### 1.3 获取单个工作流
- **Endpoint**: `GET /workflows/{workflow_id}`
- **描述**: 获取指定工作流的详细信息
- **响应** (200 OK):
```json
{
  "id": "workflow_abc123",
  "name": "string",
  "description": "string",
  "graph": {},
  "version": 1,
  "status": "draft",
  "created_at": "2026-03-01T00:00:00Z",
  "updated_at": "2026-03-01T00:00:00Z"
}
```

### 1.4 更新工作流
- **Endpoint**: `PUT /workflows/{workflow_id}`
- **描述**: 更新工作流定义
- **请求体**: 同创建工作流
- **响应** (200 OK): 返回更新后的工作流

### 1.5 删除工作流
- **Endpoint**: `DELETE /workflows/{workflow_id}`
- **描述**: 删除指定工作流
- **响应** (204 No Content)

### 1.6 发布工作流
- **Endpoint**: `POST /workflows/{workflow_id}/publish`
- **描述**: 发布工作流使其可执行
- **响应** (200 OK):
```json
{
  "id": "workflow_abc123",
  "status": "published",
  "version": 2
}
```

---

## 2. 节点类型 API

### 2.1 获取支持的节点类型
- **Endpoint**: `GET /nodes/types`
- **描述**: 获取所有支持的节点类型
- **响应** (200 OK):
```json
{
  "types": [
    {
      "type": "train_node",
      "category": "training",
      "label": "训练节点",
      "description": "用于模型训练",
      "icon": "train",
      "config_schema": {
        "model_name": { "type": "string", "required": true },
        "dataset_id": { "type": "string", "required": true },
        "epochs": { "type": "number", "default": 10 },
        "learning_rate": { "type": "number", "default": 0.001 }
      }
    },
    {
      "type": "compress_node",
      "category": "compression",
      "label": "压缩节点",
      "description": "模型压缩",
      "icon": "compress"
    },
    {
      "type": "inference_node",
      "category": "inference",
      "label": "推理节点",
      "description": "模型推理",
      "icon": "cpu"
    },
    {
      "type": "deploy_node",
      "category": "deployment",
      "label": "部署节点",
      "description": "模型部署",
      "icon": "cloud"
    },
    {
      "type": "data_node",
      "category": "data",
      "label": "数据节点",
      "description": "数据输入输出",
      "icon": "database"
    },
    {
      "type": "condition_node",
      "category": "control",
      "label": "条件节点",
      "description": "条件分支",
      "icon": "git-branch"
    }
  ]
}
```

### 2.2 获取节点配置
- **Endpoint**: `GET /nodes/{node_type}/config`
- **描述**: 获取特定节点类型的配置Schema
- **响应** (200 OK): 返回节点配置Schema

---

## 3. 执行控制 API

### 3.1 执行工作流
- **Endpoint**: `POST /workflows/{workflow_id}/run`
- **描述**: 触发工作流执行
- **请求体**:
```json
{
  "inputs": {
    "param1": "value1"
  },
  "execution_mode": "sync"  // sync | async
}
```
- **响应** (200 OK):
```json
{
  "execution_id": "exec_xyz789",
  "workflow_id": "workflow_abc123",
  "status": "running",
  "started_at": "2026-03-01T00:00:00Z"
}
```

### 3.2 获取执行状态
- **Endpoint**: `GET /executions/{execution_id}`
- **描述**: 获取执行详情和状态
- **响应** (200 OK):
```json
{
  "id": "exec_xyz789",
  "workflow_id": "workflow_abc123",
  "status": "running",  // pending | running | completed | failed | cancelled
  "inputs": {},
  "outputs": {},
  "node_executions": [
    {
      "node_id": "node_1",
      "status": "completed",
      "started_at": "2026-03-01T00:00:00Z",
      "finished_at": "2026-03-01T00:01:00Z",
      "output": {}
    }
  ],
  "started_at": "2026-03-01T00:00:00Z",
  "finished_at": null
}
```

### 3.3 取消执行
- **Endpoint**: `POST /executions/{execution_id}/cancel`
- **描述**: 取消正在执行的工作流
- **响应** (200 OK): 返回更新后的执行状态

### 3.4 获取执行历史
- **Endpoint**: `GET /workflows/{workflow_id}/executions`
- **描述**: 获取工作流的执行历史
- **查询参数**: page, page_size, status
- **响应** (200 OK): 返回执行列表

---

## 4. 任务/执行节点 API

### 4.1 获取节点执行详情
- **Endpoint**: `GET /executions/{execution_id}/nodes/{node_id}`
- **描述**: 获取特定节点的执行详情
- **响应** (200 OK):
```json
{
  "node_id": "node_1",
  "status": "completed",
  "input": {},
  "output": {},
  "error": null,
  "started_at": "2026-03-01T00:00:00Z",
  "finished_at": "2026-03-01T00:01:00Z",
  "duration": 60.5
}
```

### 4.2 重试节点执行
- **Endpoint**: `POST /executions/{execution_id}/nodes/{node_id}/retry`
- **描述**: 重试失败的节点
- **响应** (200 OK): 返回新的节点执行

---

## 5. 数据集管理 API

### 5.1 创建数据集
- **Endpoint**: `POST /datasets`
- **描述**: 创建数据集
- **请求体**:
```json
{
  "name": "string",
  "type": "training | validation",
  "source": "upload | external",
  "uri": "string"
}
```

### 5.2 获取数据集列表
- **Endpoint**: `GET /datasets`

### 5.3 获取数据集详情
- **Endpoint**: `GET /datasets/{dataset_id}`

---

## 6. 模型管理 API

### 6.1 获取模型列表
- **Endpoint**: `GET /models`
- **响应**:
```json
{
  "items": [
    {
      "id": "model_123",
      "name": "GPT-4",
      "provider": "openai",
      "type": "inference"
    }
  ]
}
```

---

## 7. 部署管理 API

### 7.1 获取部署列表
- **Endpoint**: `GET /deployments`

### 7.2 创建部署
- **Endpoint**: `POST /deployments`
- **请求体**:
```json
{
  "name": "string",
  "workflow_id": "workflow_abc123",
  "endpoint": "my-service",
  " replicas": 1
}
```

### 7.3 获取部署状态
- **Endpoint**: `GET /deployments/{deployment_id}`

---

## 8. 公共 API

### 8.1 健康检查
- **Endpoint**: `GET /health`
- **响应**: `{"status": "ok"}`

### 8.2 API 信息
- **Endpoint**: `GET /`
- **响应**: 返回 API 版本信息

---

## 错误响应格式

所有错误响应遵循以下格式:
```json
{
  "code": "ERROR_CODE",
  "message": "错误描述",
  "details": {}
}
```

常见错误码:
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `422`: 验证错误
- `500`: 服务器内部错误

---

## 状态码说明

### 工作流状态 (workflow.status)
- `draft`: 草稿
- `published`: 已发布
- `archived`: 已归档

### 执行状态 (execution.status)
- `pending`: 待执行
- `running`: 执行中
- `completed`: 已完成
- `failed`: 失败
- `cancelled`: 已取消

### 节点状态 (node_execution.status)
- `pending`: 待执行
- `running`: 执行中
- `completed`: 已完成
- `failed`: 失败
- `skipped`: 已跳过
