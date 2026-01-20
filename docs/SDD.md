# SDD v0.1 - Workflow MVP

Version: 0.1  
Status: Draft  
Last Updated: 2026-01-20

## 1. Scope and Goals

### Goals
- Provide Workflow CRUD with draft and publish versioning.
- Execute DAG workflows with a serial (single-threaded) runner.
- Support node types: start, llm, http, transformer, condition, end.
- Capture observability at run and run step level (inputs, outputs, timing, errors).
- Provide REST APIs for workflows and runs.

### Non-goals
- Multi-tenant billing or advanced RBAC.
- Knowledge base / vector database features.
- Distributed scheduling or high availability.
- Advanced DAG parallel execution.

## 2. Domain Model

| Entity | Description | Key Fields |
| --- | --- | --- |
| Workflow | Logical workflow container | id, name, description, created_at, updated_at |
| WorkflowVersion | Versioned DSL snapshot | id, workflow_id, number, status(draft/published), graph, created_at, published_at |
| Graph | DAG definition | nodes[], edges[] |
| Node | Graph node | id, type, data, position? |
| Edge | Graph edge | id, source, target, sourceHandle?, targetHandle? |
| Run | One execution of a workflow version | id, workflow_id, workflow_version_id, mode, status, inputs, output, error, started_at, ended_at |
| RunStep | One node execution record | id, run_id, node_id, node_type, status, input_snapshot, output_snapshot, error, started_at, ended_at |

## 3. Workflow DSL v0.1

### 3.1 Overview
- SDD-DSL-1: DSL structure is `{ version, graph }` where `graph = { nodes, edges }`.
- SDD-DSL-2: `Node = { id, type, data, position? }`.
- SDD-DSL-3: `Edge = { id, source, target, sourceHandle?, targetHandle? }`.
- SDD-DSL-4: DSL must be serializable JSON and stored as the workflow version graph.

### 3.2 JSON Schema (executable)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/workflow-dsl-v0.1.json",
  "title": "Workflow DSL v0.1",
  "type": "object",
  "required": ["version", "graph"],
  "properties": {
    "version": { "type": "string", "const": "0.1" },
    "graph": { "$ref": "#/$defs/Graph" }
  },
  "additionalProperties": false,
  "$defs": {
    "NodeId": {
      "type": "string",
      "pattern": "^[A-Za-z0-9_-]+$",
      "minLength": 1
    },
    "Graph": {
      "type": "object",
      "required": ["nodes", "edges"],
      "properties": {
        "nodes": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/$defs/Node" }
        },
        "edges": {
          "type": "array",
          "items": { "$ref": "#/$defs/Edge" }
        }
      },
      "additionalProperties": false
    },
    "Position": {
      "type": "object",
      "required": ["x", "y"],
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "additionalProperties": false
    },
    "NodeData": {
      "type": "object",
      "required": ["config"],
      "properties": {
        "name": { "type": "string" },
        "config": { "type": "object" }
      },
      "additionalProperties": false
    },
    "BaseNode": {
      "type": "object",
      "required": ["id", "type", "data"],
      "properties": {
        "id": { "$ref": "#/$defs/NodeId" },
        "type": { "type": "string" },
        "data": { "$ref": "#/$defs/NodeData" },
        "position": { "$ref": "#/$defs/Position" }
      },
      "additionalProperties": false
    },
    "Edge": {
      "type": "object",
      "required": ["id", "source", "target"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "source": { "$ref": "#/$defs/NodeId" },
        "target": { "$ref": "#/$defs/NodeId" },
        "sourceHandle": { "type": "string" },
        "targetHandle": { "type": "string" }
      },
      "additionalProperties": false
    },
    "StartConfig": { "type": "object", "additionalProperties": false },
    "LLMConfig": {
      "type": "object",
      "required": ["provider", "model", "prompt"],
      "properties": {
        "provider": { "type": "string", "minLength": 1 },
        "model": { "type": "string", "minLength": 1 },
        "prompt": { "type": "string", "minLength": 1 },
        "temperature": { "type": "number", "minimum": 0, "maximum": 2, "default": 0.7 },
        "max_tokens": { "type": "integer", "minimum": 1 },
        "timeout_ms": { "type": "integer", "minimum": 1, "default": 30000 }
      },
      "additionalProperties": false
    },
    "HTTPConfig": {
      "type": "object",
      "required": ["url"],
      "properties": {
        "url": { "type": "string", "format": "uri" },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
          "default": "GET"
        },
        "headers": { "type": "object", "additionalProperties": { "type": "string" } },
        "query": { "type": "object", "additionalProperties": { "type": "string" } },
        "body": {
          "type": ["object", "array", "string", "number", "boolean", "null"]
        },
        "timeout_ms": { "type": "integer", "minimum": 1, "default": 15000 },
        "ssrf": {
          "type": "object",
          "required": ["mode"],
          "properties": {
            "mode": { "type": "string", "enum": ["deny_private", "allowlist"] },
            "allowlist": { "type": "array", "items": { "type": "string" } }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "TransformerConfig": {
      "type": "object",
      "required": ["mapping"],
      "properties": {
        "mapping": { "type": "object", "additionalProperties": true }
      },
      "additionalProperties": false
    },
    "ConditionConfig": {
      "type": "object",
      "required": ["left", "op"],
      "properties": {
        "left": {},
        "op": {
          "type": "string",
          "enum": ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "exists"]
        },
        "right": {}
      },
      "additionalProperties": false
    },
    "EndConfig": { "type": "object", "additionalProperties": false },
    "StartNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "start" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/StartConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "LLMNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "llm" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/LLMConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "HTTPNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "http" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/HTTPConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "TransformerNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "transformer" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/TransformerConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "ConditionNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "condition" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/ConditionConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "EndNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "end" },
            "data": {
              "allOf": [
                { "$ref": "#/$defs/NodeData" },
                { "properties": { "config": { "$ref": "#/$defs/EndConfig" } } }
              ]
            }
          }
        }
      ]
    },
    "Node": {
      "oneOf": [
        { "$ref": "#/$defs/StartNode" },
        { "$ref": "#/$defs/LLMNode" },
        { "$ref": "#/$defs/HTTPNode" },
        { "$ref": "#/$defs/TransformerNode" },
        { "$ref": "#/$defs/ConditionNode" },
        { "$ref": "#/$defs/EndNode" }
      ]
    }
  }
}
```

### 3.3 Validation Rules Beyond JSON Schema
- SDD-DSL-5: Node IDs are unique.
- SDD-DSL-6: Edge source/target must reference existing node IDs.
- SDD-DSL-7: Exactly one start node and exactly one end node.
- SDD-DSL-8: Condition node must have exactly two outgoing edges with `sourceHandle` = `true` and `false`.
- SDD-DSL-9: Graph must be acyclic.
- SDD-DSL-10: All nodes must be reachable from the start node.
- SDD-DSL-11: MVP constraint: each node (except end) has at most one incoming edge (no join).

### 3.4 Examples (to be mirrored under examples/workflows/)

#### Example A: hello-llm.json
```json
{
  "version": "0.1",
  "graph": {
    "nodes": [
      { "id": "start", "type": "start", "data": { "config": {} } },
      {
        "id": "llm1",
        "type": "llm",
        "data": {
          "config": {
            "provider": "mock",
            "model": "gpt-4o-mini",
            "prompt": "Hello {{inputs.name}}"
          }
        }
      },
      { "id": "end", "type": "end", "data": { "config": {} } }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "llm1" },
      { "id": "e2", "source": "llm1", "target": "end" }
    ]
  }
}
```

#### Example B: http-transformer.json
```json
{
  "version": "0.1",
  "graph": {
    "nodes": [
      { "id": "start", "type": "start", "data": { "config": {} } },
      {
        "id": "http1",
        "type": "http",
        "data": {
          "config": {
            "url": "https://example.com/api/echo",
            "method": "POST",
            "headers": { "content-type": "application/json" },
            "body": { "message": "{{inputs.message}}" }
          }
        }
      },
      {
        "id": "map1",
        "type": "transformer",
        "data": {
          "config": {
            "mapping": {
              "echoed": "{{steps.http1.output.body.message}}",
              "status": "{{steps.http1.output.status}}"
            }
          }
        }
      },
      { "id": "end", "type": "end", "data": { "config": {} } }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "http1" },
      { "id": "e2", "source": "http1", "target": "map1" },
      { "id": "e3", "source": "map1", "target": "end" }
    ]
  }
}
```

#### Example C: condition-branch.json
```json
{
  "version": "0.1",
  "graph": {
    "nodes": [
      { "id": "start", "type": "start", "data": { "config": {} } },
      {
        "id": "cond1",
        "type": "condition",
        "data": {
          "config": { "left": "{{inputs.vip}}", "op": "eq", "right": true }
        }
      },
      {
        "id": "llm_vip",
        "type": "llm",
        "data": {
          "config": {
            "provider": "mock",
            "model": "gpt-4o-mini",
            "prompt": "VIP welcome for {{inputs.name}}"
          }
        }
      },
      {
        "id": "llm_std",
        "type": "llm",
        "data": {
          "config": {
            "provider": "mock",
            "model": "gpt-4o-mini",
            "prompt": "Standard welcome for {{inputs.name}}"
          }
        }
      },
      { "id": "end", "type": "end", "data": { "config": {} } }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "cond1" },
      { "id": "e2", "source": "cond1", "target": "llm_vip", "sourceHandle": "true" },
      { "id": "e3", "source": "cond1", "target": "llm_std", "sourceHandle": "false" },
      { "id": "e4", "source": "llm_vip", "target": "end" },
      { "id": "e5", "source": "llm_std", "target": "end" }
    ]
  }
}
```

## 4. Variables and Mapping

### 4.1 Context
- SDD-VAR-1: Runner context `ctx` includes:
  - `ctx.inputs`: run inputs.
  - `ctx.steps[nodeId].output`: output snapshot of a node that has completed.

### 4.2 Path Grammar
- SDD-VAR-2: Variable references are inside `{{ ... }}`.
- Supported path form:
  - Root identifiers: `inputs` or `steps`.
  - Dot segments: `[A-Za-z0-9_-]+`.
  - Array index: `[0]`, `[1]`, etc.
- Examples:
  - `{{inputs.user_id}}`
  - `{{steps.llm1.output.text}}`
  - `{{steps.http1.output.body.items[0].id}}`

### 4.3 Resolution Rules
- SDD-VAR-3: Resolution is applied to every string value in node config (deep traversal of objects/arrays).
- If the entire string is exactly one template token (e.g. `"{{inputs.foo}}"`), the resolved value keeps its original type.
- If the string contains multiple tokens or surrounding text, tokens are replaced with stringified values (JSON.stringify for objects/arrays).
- SDD-VAR-4: Missing or invalid paths cause node failure with error code `VARIABLE_RESOLUTION_ERROR`.

### 4.4 input_snapshot
- SDD-VAR-5: Before executing a node, the resolved config is captured as `input_snapshot`:
```json
{
  "config": { "...resolved node config..." },
  "resolved_refs": { "inputs.foo": "bar", "steps.nodeA.output.x": 1 }
}
```

## 5. Execution Semantics

### 5.1 Graph Validation and Topological Sort
- SDD-EXEC-1: Validate the graph using JSON Schema and rules in Section 3.3.
- SDD-EXEC-2: Compute a topological order and detect cycles. If cycle exists, fail the run with `RUN_INVALID_GRAPH`.

### 5.2 Serial Execution
- SDD-EXEC-3: Execute nodes strictly in topological order, one at a time.
- A node executes only after its single upstream dependency (MVP constraint) has succeeded.

### 5.3 Condition Branching
- SDD-EXEC-4: Condition node evaluates to boolean `matched`.
- Outgoing edge with `sourceHandle = "true"` is active when matched, otherwise `false` is active.
- Nodes on the inactive branch are marked `skipped` and do not execute.

### 5.4 Fail-fast
- SDD-EXEC-5: Any node failure fails the run immediately (status `failed`).

### 5.5 Run Output
- SDD-EXEC-6: Run output is the output of the end node in `ctx.steps[end].output`.

## 6. Node Specifications

### 6.1 Start Node (SDD-NODE-START-1)
- Config schema:
```json
{ "type": "object", "additionalProperties": false }
```
- Execute input: resolved config (empty), ctx.
- Output schema:
```json
{
  "type": "object",
  "required": ["inputs"],
  "properties": { "inputs": { "type": "object" } },
  "additionalProperties": false
}
```
- Errors: `INVALID_CONFIG`.
- Example output:
```json
{ "inputs": { "name": "Ada" } }
```

### 6.2 LLM Node (SDD-NODE-LLM-1)
- Config schema:
```json
{
  "type": "object",
  "required": ["provider", "model", "prompt"],
  "properties": {
    "provider": { "type": "string", "minLength": 1 },
    "model": { "type": "string", "minLength": 1 },
    "prompt": { "type": "string", "minLength": 1 },
    "temperature": { "type": "number", "minimum": 0, "maximum": 2, "default": 0.7 },
    "max_tokens": { "type": "integer", "minimum": 1 },
    "timeout_ms": { "type": "integer", "minimum": 1, "default": 30000 }
  },
  "additionalProperties": false
}
```
- Execute input: resolved config, ctx.
- Output schema:
```json
{
  "type": "object",
  "required": ["text"],
  "properties": {
    "text": { "type": "string" },
    "raw": { "type": "object" }
  },
  "additionalProperties": false
}
```
- Errors: `LLM_PROVIDER_ERROR`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `VARIABLE_RESOLUTION_ERROR`, `INVALID_CONFIG`.
- Example output:
```json
{ "text": "Hello Ada", "raw": { "provider": "mock" } }
```

### 6.3 HTTP Node (SDD-NODE-HTTP-1)
- Config schema:
```json
{
  "type": "object",
  "required": ["url"],
  "properties": {
    "url": { "type": "string", "format": "uri" },
    "method": { "type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"], "default": "GET" },
    "headers": { "type": "object", "additionalProperties": { "type": "string" } },
    "query": { "type": "object", "additionalProperties": { "type": "string" } },
    "body": { "type": ["object", "array", "string", "number", "boolean", "null"] },
    "timeout_ms": { "type": "integer", "minimum": 1, "default": 15000 },
    "ssrf": {
      "type": "object",
      "required": ["mode"],
      "properties": {
        "mode": { "type": "string", "enum": ["deny_private", "allowlist"] },
        "allowlist": { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```
- Execute input: resolved config, ctx.
- Output schema:
```json
{
  "type": "object",
  "required": ["status", "headers", "body", "elapsed_ms"],
  "properties": {
    "status": { "type": "integer" },
    "headers": { "type": "object", "additionalProperties": { "type": "string" } },
    "body": {},
    "elapsed_ms": { "type": "integer", "minimum": 0 }
  },
  "additionalProperties": false
}
```
- Errors: `HTTP_BAD_URL`, `HTTP_TIMEOUT`, `HTTP_REQUEST_FAILED`, `HTTP_NON_2XX`, `SSRF_BLOCKED`, `VARIABLE_RESOLUTION_ERROR`, `INVALID_CONFIG`.
- Example output:
```json
{ "status": 200, "headers": { "content-type": "application/json" }, "body": { "ok": true }, "elapsed_ms": 120 }
```

### 6.4 Transformer Node (SDD-NODE-TRANSFORMER-1)
- Config schema:
```json
{
  "type": "object",
  "required": ["mapping"],
  "properties": {
    "mapping": { "type": "object", "additionalProperties": true }
  },
  "additionalProperties": false
}
```
- Execute input: resolved config, ctx.
- Output schema:
```json
{ "type": "object", "additionalProperties": true }
```
- Errors: `TRANSFORM_ERROR`, `VARIABLE_RESOLUTION_ERROR`, `INVALID_CONFIG`.
- Example output:
```json
{ "user": "Ada", "score": 99 }
```

### 6.5 Condition Node (SDD-NODE-COND-1)
- Config schema:
```json
{
  "type": "object",
  "required": ["left", "op"],
  "properties": {
    "left": {},
    "op": { "type": "string", "enum": ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "exists"] },
    "right": {}
  },
  "additionalProperties": false
}
```
- Execute input: resolved config, ctx.
- If `op` is not `exists`, `right` must be present.
- Output schema:
```json
{
  "type": "object",
  "required": ["matched"],
  "properties": { "matched": { "type": "boolean" } },
  "additionalProperties": false
}
```
- Errors: `CONDITION_EVAL_ERROR`, `VARIABLE_RESOLUTION_ERROR`, `INVALID_CONFIG`.
- Example output:
```json
{ "matched": true }
```

### 6.6 End Node (SDD-NODE-END-1)
- Config schema:
```json
{ "type": "object", "additionalProperties": false }
```
- Execute input: resolved config, ctx.
- Output result is the output of its single upstream node.
- Output schema:
```json
{
  "type": "object",
  "required": ["result"],
  "properties": { "result": {} },
  "additionalProperties": false
}
```
- Errors: `INVALID_CONFIG`.
- Example output:
```json
{ "result": { "text": "Hello Ada" } }
```

## 7. Observability Spec

### 7.1 Run and RunStep Schemas
- SDD-OBS-1: Run schema (excerpt):
```json
{
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
}
```
- SDD-OBS-2: RunStep schema (excerpt):
```json
{
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
}
```

### 7.2 Recording Rules
- SDD-OBS-3: Create a Run record at run start (status `running`).
- SDD-OBS-4: For each node:
  - Create RunStep with status `running` and `input_snapshot` before execution.
  - Update RunStep with `output_snapshot`, `status`, and timing after execution.
- SDD-OBS-5: For skipped nodes, create RunStep with status `skipped` and no snapshots.
- SDD-OBS-7: `duration_ms` is computed as `ended_at - started_at` in milliseconds for succeeded/failed steps.

### 7.3 Redaction
- SDD-OBS-6: Apply redaction to snapshots and error.details for keys that match (case-insensitive):
  - `authorization`, `api_key`, `token`, `secret`, `password`.
- Redaction replaces values with `"***"` recursively.

## 8. Security Spec

### 8.1 API Key Auth
- SDD-SEC-1: All API requests require `Authorization: Bearer <api_key>`.
- The server validates the key against a configured allowlist.
- The frontend must not persist the API key beyond local runtime memory.

### 8.2 HTTP Node SSRF Mitigation
- SDD-SEC-2: Default SSRF policy is `deny_private`.
- Deny requests to:
  - Loopback (127.0.0.0/8, ::1)
  - Link-local (169.254.0.0/16)
  - RFC1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  - Metadata service IP (169.254.169.254)
- `allowlist` mode allows only hostnames in the allowlist.

## 9. Assumptions and Constraints

- MVP assumes no branch join; each node (except end) has at most one incoming edge.
- Exactly one end node; end must be reachable on all paths.
- LLM provider is allowed to be a stub/mocked provider for MVP.
- UI can be a JSON editor; no drag-and-drop requirement.
- Example workflows in Section 3.4 will be mirrored to `examples/workflows/` in the next iteration.
