# API v0.1

Base URL: `/v1`  
Auth: `Authorization: Bearer <api_key>`  
Time format: RFC3339 strings.

## 1. Authentication
- API-AUTH-1: All endpoints require a valid API key via `Authorization` header.

## 2. Error Format
- API-ERR-1: All errors use a unified structure:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 3. Schema Bundle (JSON Schema, executable)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/api-v0.1.json",
  "title": "API v0.1 Schema Bundle",
  "type": "object",
  "$defs": {
    "Error": {
      "type": "object",
      "required": ["code", "message"],
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "details": {}
      },
      "additionalProperties": false
    },
    "ErrorResponse": {
      "type": "object",
      "required": ["error"],
      "properties": { "error": { "$ref": "#/$defs/Error" } },
      "additionalProperties": false
    },
    "Workflow": {
      "type": "object",
      "required": ["id", "name", "created_at", "updated_at"],
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "description": { "type": ["string", "null"] },
        "created_at": { "type": "string" },
        "updated_at": { "type": "string" }
      },
      "additionalProperties": false
    },
    "WorkflowVersion": {
      "type": "object",
      "required": ["id", "workflow_id", "number", "status", "graph", "created_at"],
      "properties": {
        "id": { "type": "string" },
        "workflow_id": { "type": "string" },
        "number": { "type": "integer", "minimum": 1 },
        "status": { "type": "string", "enum": ["draft", "published"] },
        "graph": { "$ref": "workflow-dsl-v0.1.json#/$defs/Graph" },
        "created_at": { "type": "string" },
        "published_at": { "type": ["string", "null"] }
      },
      "additionalProperties": false
    },
    "Run": {
      "type": "object",
      "required": ["id", "workflow_id", "workflow_version_id", "mode", "status", "inputs", "started_at"],
      "properties": {
        "id": { "type": "string" },
        "workflow_id": { "type": "string" },
        "workflow_version_id": { "type": "string" },
        "mode": { "type": "string", "enum": ["debug", "production"] },
        "status": { "type": "string", "enum": ["running", "succeeded", "failed"] },
        "inputs": { "type": "object" },
        "output": {},
        "error": { "type": ["object", "null"] },
        "started_at": { "type": "string" },
        "ended_at": { "type": ["string", "null"] }
      },
      "additionalProperties": false
    },
    "RunStep": {
      "type": "object",
      "required": ["id", "run_id", "node_id", "node_type", "status"],
      "properties": {
        "id": { "type": "string" },
        "run_id": { "type": "string" },
        "node_id": { "type": "string" },
        "node_type": { "type": "string" },
        "status": { "type": "string", "enum": ["running", "succeeded", "failed", "skipped"] },
        "input_snapshot": { "type": ["object", "null"] },
        "output_snapshot": { "type": ["object", "null"] },
        "error": { "type": ["object", "null"] },
        "started_at": { "type": ["string", "null"] },
        "ended_at": { "type": ["string", "null"] },
        "duration_ms": { "type": ["integer", "null"], "minimum": 0 }
      },
      "additionalProperties": false
    },
    "CreateWorkflowRequest": {
      "type": "object",
      "required": ["name", "graph"],
      "properties": {
        "name": { "type": "string" },
        "description": { "type": ["string", "null"] },
        "graph": { "$ref": "workflow-dsl-v0.1.json#/$defs/Graph" }
      },
      "additionalProperties": false
    },
    "CreateWorkflowResponse": {
      "type": "object",
      "required": ["workflow", "draft"],
      "properties": {
        "workflow": { "$ref": "#/$defs/Workflow" },
        "draft": { "$ref": "#/$defs/WorkflowVersion" }
      },
      "additionalProperties": false
    },
    "UpdateDraftResponse": {
      "type": "object",
      "required": ["draft"],
      "properties": { "draft": { "$ref": "#/$defs/WorkflowVersion" } },
      "additionalProperties": false
    },
    "ListWorkflowsResponse": {
      "type": "object",
      "required": ["items"],
      "properties": {
        "items": { "type": "array", "items": { "$ref": "#/$defs/Workflow" } }
      },
      "additionalProperties": false
    },
    "WorkflowResponse": {
      "type": "object",
      "required": ["workflow"],
      "properties": { "workflow": { "$ref": "#/$defs/Workflow" } },
      "additionalProperties": false
    },
    "UpdateWorkflowRequest": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": ["string", "null"] }
      },
      "additionalProperties": false
    },
    "DeleteWorkflowResponse": {
      "type": "object",
      "required": ["deleted"],
      "properties": { "deleted": { "type": "boolean", "const": true } },
      "additionalProperties": false
    },
    "UpdateDraftRequest": {
      "type": "object",
      "required": ["graph"],
      "properties": {
        "graph": { "$ref": "workflow-dsl-v0.1.json#/$defs/Graph" }
      },
      "additionalProperties": false
    },
    "PublishResponse": {
      "type": "object",
      "required": ["published"],
      "properties": { "published": { "$ref": "#/$defs/WorkflowVersion" } },
      "additionalProperties": false
    },
    "ListVersionsResponse": {
      "type": "object",
      "required": ["items"],
      "properties": {
        "items": { "type": "array", "items": { "$ref": "#/$defs/WorkflowVersion" } }
      },
      "additionalProperties": false
    },
    "VersionResponse": {
      "type": "object",
      "required": ["version"],
      "properties": { "version": { "$ref": "#/$defs/WorkflowVersion" } },
      "additionalProperties": false
    },
    "RunCreateRequest": {
      "type": "object",
      "required": ["workflow_id", "mode", "inputs"],
      "properties": {
        "workflow_id": { "type": "string" },
        "version_id": { "type": ["string", "null"] },
        "mode": { "type": "string", "enum": ["debug", "production"] },
        "inputs": { "type": "object" }
      },
      "additionalProperties": false
    },
    "RunResponse": {
      "type": "object",
      "required": ["run"],
      "properties": { "run": { "$ref": "#/$defs/Run" } },
      "additionalProperties": false
    },
    "RunDetailResponse": {
      "type": "object",
      "required": ["run"],
      "properties": {
        "run": { "$ref": "#/$defs/Run" },
        "steps": { "type": "array", "items": { "$ref": "#/$defs/RunStep" } }
      },
      "additionalProperties": false
    }
  }
}
```

## 4. Workflow Endpoints

### 4.1 Create Workflow
- API-WF-1: `POST /v1/workflows`
- Request schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/CreateWorkflowRequest" }
```
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/CreateWorkflowResponse" }
```

### 4.2 List Workflows
- API-WF-2: `GET /v1/workflows`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/ListWorkflowsResponse" }
```

### 4.3 Get Workflow
- API-WF-3: `GET /v1/workflows/{workflow_id}`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/WorkflowResponse" }
```

### 4.4 Update Workflow Metadata
- API-WF-4: `PATCH /v1/workflows/{workflow_id}`
- Request schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/UpdateWorkflowRequest" }
```
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/WorkflowResponse" }
```

### 4.5 Delete Workflow
- API-WF-5: `DELETE /v1/workflows/{workflow_id}`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/DeleteWorkflowResponse" }
```

### 4.6 Update Draft Graph
- API-WF-6: `PUT /v1/workflows/{workflow_id}/draft`
- Request schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/UpdateDraftRequest" }
```
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/UpdateDraftResponse" }
```

### 4.7 Publish Draft
- API-WF-7: `POST /v1/workflows/{workflow_id}/publish`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/PublishResponse" }
```
- Behavior: creates a new published version from the current draft.

### 4.8 List Versions
- API-WF-8: `GET /v1/workflows/{workflow_id}/versions`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/ListVersionsResponse" }
```

### 4.9 Get Version
- API-WF-9: `GET /v1/workflows/{workflow_id}/versions/{version_id}`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/VersionResponse" }
```

## 5. Run Endpoints

### 5.1 Create Run
- API-RUN-1: `POST /v1/runs`
- Request schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/RunCreateRequest" }
```
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/RunResponse" }
```
- Behavior:
  - If `mode = production`, `version_id` defaults to latest published version.
  - If `mode = debug`, the current draft version is used.

### 5.2 Get Run (with steps)
- API-RUN-2: `GET /v1/runs/{run_id}?include_steps=true|false`
- Response schema:
```json
{ "$ref": "https://example.com/schemas/api-v0.1.json#/$defs/RunDetailResponse" }
```

## 6. Error Codes (non-exhaustive)

- AUTH_REQUIRED, AUTH_INVALID
- NOT_FOUND, VALIDATION_ERROR, CONFLICT
- RUN_INVALID_GRAPH, RUN_FAILED
- NODE_FAILED, VARIABLE_RESOLUTION_ERROR

## 7. Example curl

### Create Workflow
```bash
curl -X POST http://localhost:3000/v1/workflows \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"hello","graph":{"nodes":[{"id":"start","type":"start","data":{"config":{}}},{"id":"end","type":"end","data":{"config":{}}}],"edges":[{"id":"e1","source":"start","target":"end"}]}}'
```

### Publish Draft
```bash
curl -X POST http://localhost:3000/v1/workflows/wf_123/publish \
  -H "Authorization: Bearer $API_KEY"
```

### Run Workflow (production)
```bash
curl -X POST http://localhost:3000/v1/runs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"wf_123","mode":"production","inputs":{"name":"Ada"}}'
```
