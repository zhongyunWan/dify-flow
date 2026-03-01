# QS2 Workflow

一个可视化的工作流编排应用，用于大型语言模型（LLM）操作的编排，包括训练、压缩、推理、部署。

## 特性

- **可视化工作流编辑器** - 拖拽式节点编排，直观设计 AI 工作流
- **多种节点类型** - 支持训练、压缩、推理、部署、数据处理、条件分支等节点
- **实时执行** - 支持工作流实时执行和状态追踪
- **RESTful API** - 完整的后端 API，支持工作流管理

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- @xyflow/react (React Flow) - 工作流可视化
- Zustand - 状态管理
- Tailwind CSS

### 后端
- FastAPI
- Pydantic
- Uvicorn

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.8+

### 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/dify-flow.git
cd dify-flow

# 安装前端依赖
cd web
npm install

# 安装后端依赖
cd ../api
pip install -r requirements.txt
```

### 启动

```bash
# 启动后端 (http://localhost:8000)
cd api
python main.py

# 启动前端 (http://localhost:5173)
cd web
npm run dev
```

## 项目结构

```
dify-flow/
├── api/                    # 后端 (FastAPI)
│   ├── main.py            # 入口文件
│   ├── database.py        # 内存数据库
│   ├── schemas.py         # Pydantic 模型
│   ├── routes/            # API 路由
│   └── tests/             # 测试
├── web/                   # 前端 (React)
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── store/         # Zustand 状态管理
│   │   ├── services/      # API 服务
│   │   └── types/         # TypeScript 类型
│   └── package.json
├── docs/                     # 文档
│   ├── ARCHITECTURE.md       # 架构文档
│   └── api-spec.md          # API 规范
└── README.md
```

## API 文档

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/health | 健康检查 |
| POST | /api/v1/workflows | 创建工作流 |
| GET | /api/v1/workflows | 获取工作流列表 |
| GET | /api/v1/workflows/{id} | 获取工作流详情 |
| PUT | /api/v1/workflows/{id} | 更新工作流 |
| DELETE | /api/v1/workflows/{id} | 删除工作流 |
| POST | /api/v1/workflows/{id}/run | 执行工作流 |
| GET | /api/v1/executions/{id} | 获取执行状态 |
| GET | /api/v1/nodes/types | 获取节点类型 |

详细 API 规范请参考 [api-spec.md](./docs/api-spec.md)

## 节点类型

| 类型 | 名称 | 说明 |
|------|------|------|
| `train_node` | 训练节点 | 模型训练 |
| `compress_node` | 压缩节点 | 模型压缩 |
| `inference_node` | 推理节点 | 模型推理 |
| `deploy_node` | 部署节点 | 模型部署 |
| `data_node` | 数据节点 | 数据处理 |
| `condition_node` | 条件节点 | 条件分支 |

## 运行测试

```bash
# 后端测试
cd api
pytest

# 前端测试
cd web
npm run lint
```

## License

MIT License
