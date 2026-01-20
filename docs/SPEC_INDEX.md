## Spec Index (Single Source of Truth Map)

> 目的：把所有规范文档组织成“可链接、可追溯、可被 AI 持续实现”的索引。后续实现与测试应以这里的链接作为入口，避免在代码里“发明新规范”。

---

### 1. Normative Specs（具有约束力的规范）

- **Project-level SDD（DSL / 执行语义 / 节点规格 / 安全与可观测）**：`docs/SDD.md`
  - DSL：SDD-DSL-*
  - Variables/Mapping：SDD-VAR-*
  - Execution：SDD-EXEC-*
  - Node Specs：SDD-NODE-*
  - Observability：SDD-OBS-*
  - Security：SDD-SEC-*

- **System Design SDD（模块化系统级规范）**：`docs/SYSTEM_DESIGN_SDD.md`
  - 模块职责/依赖/稳定契约/扩展钩子/明确取舍

- **API Contract（REST + Schema Bundle）**：`docs/API.md`
  - 端点：API-WF-*、API-RUN-*
  - 认证：API-AUTH-*
  - 错误格式：API-ERR-*

- **Acceptance Tests（验收用例，作为实现完成定义）**：`docs/ACCEPTANCE_TESTS.md`
  - AT-1 ~ AT-4：覆盖版本化、debug/production 选择、HTTP 失败可追溯、condition skip

---

### 2. Architecture Decisions（架构决策记录）

- **ADR 0001（技术栈 + 包布局）**：`docs/ADR/0001-architecture.md`

---

### 3. Implementation Traceability（实现追溯规则）

- **规则 1：Spec-first**
  - 任何实现 PR 必须能指向一个或多个 Spec clause IDs（例如 SDD-EXEC-3、API-RUN-1）。

- **规则 2：Contract-stability**
  - `docs/SDD.md` 与 `docs/API.md` 是对外与对内的合同锚点；变更必须同步更新验收测试与版本号（后续迭代规则）。

- **规则 3：Acceptance-driven**
  - 以 `docs/ACCEPTANCE_TESTS.md` 定义“完成”。实现新增能力时应新增对应 AT 用例或扩展现有用例。

