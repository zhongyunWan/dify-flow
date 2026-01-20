## Vibe Coding Guide (AI File-by-file Implementation Protocol)

> 目的：把规范转化成“AI 逐文件实现”可执行的协议：哪些东西是稳定锚点、哪些目录允许反复生成、哪些内核必须由人类守护，以及如何用验收测试驱动增量落地。

---

### 1. Stable Anchors（每次实现都必须对齐的稳定锚点）

- **DSL 事实来源**：`docs/SDD.md` Section 3（SDD-DSL-*）
- **运行语义**：`docs/SDD.md` Section 5（SDD-EXEC-*）
- **Context 与变量解析**：`docs/SDD.md` Section 4（SDD-VAR-*）
- **节点行为**：`docs/SDD.md` Section 6（SDD-NODE-*）
- **可观测性**：`docs/SDD.md` Section 7（SDD-OBS-*）
- **安全约束**：`docs/SDD.md` Section 8（SDD-SEC-*）
- **API 合同**：`docs/API.md`（API-*)
- **系统模块边界**：`docs/SYSTEM_DESIGN_SDD.md`
- **完成定义**：`docs/ACCEPTANCE_TESTS.md`（AT-*)

这些文件中的“契约”优先级高于任何代码注释、README、或临时实现决定。

---

### 2. Repository Layout（用于实现的建议目录锚点）

> 与 ADR 0001 对齐；用于后续逐文件生成时的“固定落点”。当前仓库仅有 docs，不代表这些目录已存在。

- `packages/workflow-core/`
  - DSL types + JSON Schemas（workflow-dsl-v0.1）
  - Graph validation + planner/compiler
  - Runtime/Engine（串行 runner）
  - Node registry + built-in nodes
  - Variable resolution + context model

- `apps/server/`
  - Fastify API server
  - Auth（API key allowlist）
  - Persistence（SQLite/Prisma）与 Repos
  - Observability recording（Run/RunStep）

- `apps/web/`（可选 MVP）
  - 最小 JSON editor（不作为系统核心）

---

### 3. “可生成区” vs “受保护区”（重要）

#### 3.1 可反复生成 & 覆盖的区域（AI 友好）

> 特征：局部性强、低耦合、改坏也容易发现/修复。

- **Built-in Nodes**
  - 每个 node 类型一个文件/目录（start/llm/http/transformer/condition/end）
  - 对齐 `docs/SDD.md` Section 6 的节点规格（SDD-NODE-*)

- **Providers / Clients**
  - LLM provider（可先 mock）
  - HTTP client（包含 SSRF policy 的实现细节）

- **API Routes（薄胶水层）**
  - endpoint handler 只做：校验输入 → 调用核心模块 → 返回符合 schema 的响应
  - 永远以 `docs/API.md` 为合同

#### 3.2 受保护区（人类主导，不应被 AI 轻易改动）

> 特征：全局语义、变更影响面大、回归成本高。

- **Runtime/Engine 主循环与状态机语义**
  - 串行 topo（SDD-EXEC-3）
  - condition 分支与 skip（SDD-EXEC-4）
  - fail-fast（SDD-EXEC-5）

- **Graph Validation 规则集合**
  - 无环/可达性/唯一 start&end/condition 边约束/MVP 无 join（SDD-DSL-5~11）

- **Variable Resolution 语义**
  - `{{...}}` 的解析与缺失路径失败策略（SDD-VAR-2~4）
  - `input_snapshot` 的构造（SDD-VAR-5）

- **Observability & Redaction**
  - Run/RunStep 记录规则（SDD-OBS-*）
  - 脱敏关键字集合（SDD-OBS-6）

- **Persistence schema & migrations（SQLite/Prisma）**
  - 一旦发布会影响数据兼容；必须谨慎演进

- **对外合同文档**
  - `docs/API.md`、`docs/ACCEPTANCE_TESTS.md`、`docs/SDD.md`

---

### 4. Incremental Implementation Slices（建议的逐步落地切片）

> 每个切片都应能独立 commit，并尽可能对应至少一个验收测试或其子集。

- **Slice A：Workflow core skeleton**
  - 目标：把 DSL types/schema、validation、planner 的骨架落地
  - 主要锚点：SDD-DSL-*、SDD-EXEC-1/2

- **Slice B：Runtime/Engine + Context + Variable Resolution**
  - 目标：可在内存跑通示例 graph（先不接 API/DB）
  - 主要锚点：SDD-VAR-*、SDD-EXEC-*、SDD-OBS-*（先内存 recorder 也可）

- **Slice C：Built-in Nodes**
  - 目标：实现 start/end/transformer/condition，再接 llm/http
  - 主要锚点：SDD-NODE-*

- **Slice D：Persistence + API server**
  - 目标：实现 API 合同与 AT-1~AT-4
  - 主要锚点：API-*、AT-*、SDD-SEC-1

---

### 5. AI PR Rules（Vibe Coding 的提交规则）

- **Rule 1：每次改动必须引用规范**
  - 在 commit message 或 PR 描述中列出相关 clause IDs（例如 SDD-EXEC-3、API-RUN-1、AT-1）。

- **Rule 2：接口优先于实现细节**
  - 先写稳定接口（模块边界/输入输出），再填充内部逻辑。

- **Rule 3：拒绝“隐式扩展”**
  - 不新增未在规范中出现的能力（例如并行、重试、join），除非先修改 specs 并新增验收测试。

