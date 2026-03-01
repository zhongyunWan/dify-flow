# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QS2 Workflow is a visual workflow orchestration application for large language model operations (training, compression, inference, deployment). It consists of two main components:

- **Backend**: Python FastAPI (`api/`)
- **Frontend**: React + TypeScript + Vite (`web/`)

## Commands

### Backend (API)

```bash
cd api
pip install -r requirements.txt
python main.py                    # Start API server on http://localhost:8000
pytest                            # Run tests
pytest api/tests/test_workflows.py # Run specific test file
```

### Frontend (Web)

```bash
cd web
npm run dev     # Start dev server on http://localhost:5173
npm run build   # Production build
npm run lint    # Run ESLint
npm run preview # Preview production build
```

## Architecture

### Backend (`api/`)

- **Framework**: FastAPI with Pydantic for validation
- **Storage**: In-memory database (MVP)
- **Entry point**: `api/main.py`
- **Database models**: `api/database.py`
- **API Routes**: `api/routes/` (workflows, nodes, executions)
- **API Base URL**: `http://localhost:8000/api/v1`

### Frontend (`web/`)

- **Framework**: React 19 + TypeScript
- **Build tool**: Vite
- **State management**: Zustand (`web/src/store/workflowStore.ts`)
- **Visual workflow editor**: @xyflow/react (React Flow)
- **HTTP client**: Axios
- **Styling**: Tailwind CSS 4
- **API client**: `web/src/services/api.ts`

### Node Types

Supported node types: `train_node`, `compress_node`, `inference_node`, `deploy_node`, `data_node`, `condition_node`

### API Specification

Full API specification is documented in `api-spec.md`. Key endpoints:
- `GET /api/v1/health` - Health check
- `POST /api/v1/workflows` - Create workflow
- `GET /api/v1/workflows` - List workflows
- `POST /api/v1/workflows/{id}/run` - Execute workflow
- `GET /api/v1/nodes/types` - Get node types
- `GET /api/v1/executions/{id}` - Get execution status
