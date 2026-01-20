## System Design SDD v0.1 (Workflow-centric)

Version: 0.1  
Status: Draft  
Last Updated: 2026-01-20

> 目标：在不引入分布式与 DAG 调度框架的前提下，将「简化版 Dify（聚焦 Workflow）」的能力拆解为可演进模块，并为后续 Vibe Coding（AI 逐文件实现）提供稳定锚点与可扩展边界。
>
> 依赖与对齐：
> - 领域/DSL/执行语义：见 `docs/SDD.md`
> - API 合同：见 `docs/API.md`
> - 验收测试：见 `docs/ACCEPTANCE_TESTS.md`
> - 技术选型与包布局：见 `docs/ADR/0001-architecture.md`

---

### 1️⃣ System Overview

#### 系统的核心运行范式（一句话）

以「版本化 Workflow DSL」为唯一事实来源：对选定版本进行校验 → 编译为可执行计划 → 串行执行节点 → 按 Run/RunStep 记录全链路输入输出与错误。

#### 用户行为 → 系统反应 → 执行结果（主链路）

- **创建/编辑 Workflow**
  - 用户提交 Graph（DSL）创建或更新 Draft
  - 系统进行 DSL 校验（JSON Schema + 业务规则），将 Graph 存为 Draft Version
  - 返回 Draft Version（可继续编辑）

- **发布 Workflow**
  - 用户触发 Publish
  - 系统对 Draft 再次校验并冻结为新的 Published Version（不可变）
  - 返回 Published Version（后续 production run 默认使用）

- **执行 Workflow（Run）**
  - 用户发起 Run（debug/production）
  - 系统选择版本（API-RUN-1 行为）：debug=Draft；production=Latest Published（或指定 version）
  - 系统校验与编译执行计划，按拓扑序串行执行节点（SDD-EXEC-3）
  - 产生 Run.output（End 节点输出，SDD-EXEC-6）与 RunStep 明细（SDD-OBS-*）

---

### 2️⃣ Core Modules Definition

> 模块定义格式：模块名 / 核心职责 / 是否为领域核心（Core/Support）/ Capability / Explicit Non-Goals

#### 2.1 Workflow Definition & Versioning

- **模块名**：Workflow Definition & Versioning
- **核心职责**：
  - Workflow 元数据管理（name/description）
  - WorkflowVersion 管理（draft/published、版本号递增、发布冻结）
  - 将 DSL Graph 作为版本快照持久化（SDD-DSL-*）
- **领域核心**：Core
- **Capability（对外暴露）**：
  - Create Workflow（创建并生成 Draft）
  - Update Draft Graph（仅编辑 draft）
  - Publish Draft（生成新的 published version）
  - List/Get Workflows & Versions
- **Explicit Non-Goals（不负责）**：
  - 不负责执行（由 Runtime/Engine）
  - 不负责协作编辑/冲突合并
  - 不负责高级 RBAC/多租户计费

#### 2.2 DSL Validation (Schema + Rules)

- **模块名**：DSL Validation
- **核心职责**：
  - JSON Schema 校验（SDD-DSL-1~4）
  - 业务规则校验（SDD-DSL-5~11：唯一 start/end、无环、可达性、condition 出边约束、MVP 无 join）
- **领域核心**：Core
- **Capability**：
  - `validateGraph(graph) -> ValidationResult`
  - 输出统一错误码（如 `VALIDATION_ERROR` / `RUN_INVALID_GRAPH`）
- **Explicit Non-Goals**：
  - 不做自动修复/自动补边
  - 不做图优化与重写

#### 2.3 Execution Planner / Compiler

- **模块名**：Execution Planner / Compiler
- **核心职责**：
  - 将 Graph 编译为可执行计划（最小化：拓扑序、索引结构、分支规则支撑）
  - 为串行执行提供“确定的、可重放”的节点顺序与依赖信息
- **领域核心**：Core
- **Capability**：
  - `compile(graph) -> ExecutionPlan`（包含 topo order、邻接索引、start/end 定位等）
- **Explicit Non-Goals**：
  - 不做调度（无分布式、无并行、无队列）
  - 不做运行中结构变更（版本冻结后执行）

#### 2.4 Workflow Runtime / Engine

- **模块名**：Workflow Runtime / Engine
- **核心职责**：
  - 创建并驱动一次 Execution（Run）
  - 串行拓扑执行（SDD-EXEC-3）、条件分支与 skip（SDD-EXEC-4）、fail-fast（SDD-EXEC-5）
  - 产出 Run.output（SDD-EXEC-6）
- **领域核心**：Core
- **Capability**：
  - `run(version, inputs, mode) -> Run`
  - 节点生命周期管理（running/succeeded/failed/skipped → RunStep）
- **Explicit Non-Goals**：
  - 不提供重试/补偿/回滚
  - 不支持并行节点
  - 不支持循环/迭代（图必须 acyclic）

#### 2.5 Node System (Registry + Executors)

- **模块名**：Node System
- **核心职责**：
  - Node 类型注册与查找（start/llm/http/transformer/condition/end）
  - Node 执行器实现：输入=解析后的 config + ctx，输出=结构化对象（见 SDD Node specs）
  - Node 级错误归一（code/message/details）
- **领域核心**：Core
- **Capability**：
  - `NodeRegistry.get(type) -> NodeExecutor`
  - `NodeExecutor.execute(resolvedConfig, ctx) -> output`
- **Explicit Non-Goals**：
  - 不负责图级控制流（由 Engine 决策）
  - 不负责跨 Run 的长期记忆

#### 2.6 Execution Context (State & Memory)

- **模块名**：Execution Context
- **核心职责**：
  - 运行态上下文：`ctx.inputs`、`ctx.steps[nodeId].output`（SDD-VAR-1）
  - 节点完成后写入 steps snapshot，供后续节点引用（SDD-VAR-2~4）
- **领域核心**：Core
- **Capability**：
  - `ctx.get(path)` / `ctx.setStepOutput(nodeId, output)`（概念能力）
- **Explicit Non-Goals**：
  - 不提供跨 Run 的共享状态（无 KB/向量库）
  - 不处理大对象分层存储（MVP 内存优先）

#### 2.7 Variable Resolution (Template → Value)

- **模块名**：Variable Resolution
- **核心职责**：
  - 解析 `{{...}}`，将 `inputs`/`steps.*.output` 注入到 node config（SDD-VAR-2~4）
  - 生成 `input_snapshot`（含 resolved_refs，SDD-VAR-5）
  - 缺失或非法路径导致节点失败（`VARIABLE_RESOLUTION_ERROR`）
- **领域核心**：Core
- **Capability**：
  - `resolveConfig(config, ctx) -> { resolvedConfig, resolvedRefs }`
- **Explicit Non-Goals**：
  - 不支持任意表达式/脚本执行
  - 不做静态类型推导

#### 2.8 Observability (Run / RunStep Recording + Redaction)

- **模块名**：Observability
- **核心职责**：
  - 记录 Run/RunStep 状态流转与时间（SDD-OBS-3~5,7）
  - 记录输入输出快照（input_snapshot/output_snapshot）
  - 敏感字段脱敏（SDD-OBS-6）
- **领域核心**：Support（但契约应稳定）
- **Capability**：
  - `recordRunStart/recordStepStart/recordStepEnd/recordRunEnd`
  - `redact(obj) -> obj`
- **Explicit Non-Goals**：
  - 不做分布式 tracing
  - 不做日志平台集成（可后续扩展）

#### 2.9 IO & Integration Layer (Providers)

- **模块名**：IO & Integration Layer
- **核心职责**：
  - LLM Provider 抽象（MVP 允许 mock，SDD Assumptions）
  - HTTP Client + SSRF 防护策略执行（SDD-SEC-2）
- **领域核心**：Support
- **Capability**：
  - `LLMProvider.generate(...)`
  - `HttpClient.request(...)`（内置 SSRF policy）
- **Explicit Non-Goals**：
  - 不做统一凭据中心/Secret Vault
  - 不做复杂连接器市场

#### 2.10 Persistence Layer (SQLite/Prisma Repos)

- **模块名**：Persistence Layer
- **核心职责**：
  - Workflow/Version/Run/RunStep 持久化与查询（与 API schema 对齐）
  - 事务边界（发布、创建 Run、步骤更新）
- **领域核心**：Support
- **Capability**：
  - Repository 接口（WorkflowRepo/RunRepo/RunStepRepo…）
- **Explicit Non-Goals**：
  - 不做多数据库/分片/HA
  - 不做事件溯源

#### 2.11 API Layer (Fastify REST)

- **模块名**：API Layer
- **核心职责**：
  - 实现 `docs/API.md` 合同
  - API key 认证（SDD-SEC-1 / API-AUTH-1）
  - 调用 Definition/Runtime/Query 模块形成响应
- **领域核心**：Support
- **Capability**：
  - `/v1/workflows/*`、`/v1/runs/*`
- **Explicit Non-Goals**：
  - 不提供 webhook/回调（MVP 以查询为主）
  - 不强制要求 UI（可选）

---

### 3️⃣ Module Interaction Diagram（文字版）

#### 3.1 Workflow 定义 / 发布链路

```
Client
  -> API Layer (Auth)
      -> Workflow Definition & Versioning
          -> DSL Validation
          -> Persistence Layer
  <- Create/Update/Publish responses
```

#### 3.2 Run 执行链路（以 Workflow 为核心的系统运行模型）

```
Client POST /v1/runs
  -> API Layer (Auth)
      -> Runtime/Engine
          -> select version (API-RUN-1)
          -> DSL Validation (SDD-EXEC-1/2 gate)
          -> Execution Planner compile()
          -> Observability: Run(status=running)
          -> init Context (ctx.inputs = inputs)
          -> for node in topo order:
                -> branch decision (condition) / skip
                -> Variable Resolution => input_snapshot (SDD-VAR-5)
                -> Observability: RunStep(status=running)
                -> Node System executor.execute()
                -> ctx.steps[nodeId].output = output
                -> Observability: RunStep(status=succeeded)
                -> on error: fail-fast (SDD-EXEC-5)
          -> Run.output = end output (SDD-EXEC-6)
          -> Observability: Run(status=succeeded/failed)
  <- { run }
```

#### 3.3 Node 生命周期（执行链路视角）

- planned（在 ExecutionPlan 中存在，MVP 可不落库）
- running（创建 RunStep + input_snapshot）
- succeeded（写入 ctx.steps[nodeId].output + output_snapshot）
- failed（节点失败导致 Run 失败，fail-fast）
- skipped（条件分支非活跃路径，创建 RunStep(status=skipped)）

#### 3.4 Context/State 流转规则

- `ctx.inputs`：Run 注入后视为只读
- `ctx.steps`：按执行顺序递增写入，后续节点仅可引用“已完成节点”的输出
- Variable Resolution 只读 `inputs` 与 `steps.*.output`，缺失即失败（SDD-VAR-4）

---

### 4️⃣ Core Data Models（概念级）

> 不展开字段细节；仅描述关系（聚合/引用）与生命周期。

- **Workflow**
  - **聚合**：WorkflowVersion（1..n）
  - **生命周期**：长期存在

- **WorkflowVersion**
  - **引用**：Graph（DSL 快照）
  - **生命周期**：
    - draft：可变
    - published：不可变（冻结）

- **Graph**
  - **聚合**：Node[]、Edge[]
  - **生命周期**：随 Version 快照存在；运行时编译为 ExecutionPlan（临时）

- **Node**
  - **被聚合于**：Graph
  - **运行态映射**：RunStep（0..1，MVP 串行单次）

- **Edge**
  - **被聚合于**：Graph
  - **控制流**：source → target；condition 通过 `sourceHandle(true/false)` 表达分支

- **Execution（Run）**
  - **引用**：Workflow、WorkflowVersion
  - **聚合**：RunStep（1..n）
  - **生命周期**：一次运行，从 running 到 succeeded/failed

- **Context**
  - **属于**：一次 Execution
  - **内容**：inputs + steps outputs
  - **生命周期**：仅运行期存在（MVP）

- **Artifact / Output**
  - **节点级**：`ctx.steps[nodeId].output`
  - **Run 级**：`Run.output` 取 End 节点输出
  - **生命周期**：运行态产生；可被快照持久化（经 redaction）

---

### 5️⃣ Extensibility & Vibe Coding Hooks

#### 5.1 新增 Node 类型时的稳定点（不动点）

- DSL 基本形状（SDD-DSL-1~4）
- 执行语义：校验→编译→串行 topo→fail-fast→End 输出（SDD-EXEC-*）
- Context 契约：`ctx.inputs` 与 `ctx.steps[nodeId].output`（SDD-VAR-1）
- Variable Resolution 规则（SDD-VAR-2~5）
- Observability 记录规则与 redaction（SDD-OBS-*）

#### 5.2 新增 Node 的扩展点（应当局部改动）

- DSL Schema：为新的 `node.type` 增加 schema 分支
- Node System：新增 executor 并注册
- 测试：新增最小验收样例 workflow 覆盖节点语义（参照 `docs/ACCEPTANCE_TESTS.md` 的风格）

#### 5.3 Vibe Coding：可反复生成/覆盖 vs 人类主导

- **可反复被 AI 生成 & 覆盖（推荐）**
  - Built-in Node executors（每个 node 一个文件/目录）
  - Providers/Clients 的适配层（mock LLM、HTTP client 细节）
  - API routes 的薄胶水层（严格对齐 `docs/API.md`）

- **人类主导，不应被 AI 轻易改动（稳定内核）**
  - DSL Validation 的规则集合（无环/可达/condition 边/无 join）
  - Variable Resolution 语义与错误策略
  - Runtime/Engine 的主循环与状态机语义
  - Observability & Redaction（安全/调试根）
  - 数据库 schema 与迁移策略（SQLite/Prisma）
  - 对外 API 合同与验收测试文档

---

### 6️⃣ Explicit Design Trade-offs

#### 刻意不做的事（简化版 Dify 边界）

- 不引入分布式系统：无队列、无 worker 集群、无 HA
- 不引入 DAG 调度框架：无 Temporal/Airflow 类能力
- 不做并行执行：严格串行 topo
- 不支持 join：MVP 限制“每个节点（除 end）最多一个入边”（SDD-DSL-11）
- 不支持循环/迭代：图必须 acyclic（SDD-DSL-9）
- 不做重试/补偿/断点续跑：fail-fast（SDD-EXEC-5）
- 不做 KB/向量库/长记忆：Context 仅限单次 run
- 不做高级权限/多租户：API key allowlist（SDD-SEC-1）
- 不要求可视化编排器：UI 可退化为 JSON editor（SDD Assumptions）

#### 为什么现在不做（为 Vibe Coding 降低复杂度）

- 串行 + fail-fast + 无 join 能显著减少执行时序与边界条件，降低 AI 逐文件实现的偏差与回归成本。
- 先固化 DSL/Context/Observability 三个全局契约，后续新增 Node 在稳定轨道上扩展，不牵一发动全身。
- 验收测试（AT-1~AT-4）聚焦“版本化 + 执行 + 可观测”，避免异步调度带来的不确定性与实现膨胀。

