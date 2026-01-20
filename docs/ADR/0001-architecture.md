# ADR 0001: Architecture and Technology Choices

Status: Accepted  
Date: 2026-01-20

## Context
- The project targets a workflow MVP with versioned DSL, serial runner, and REST APIs.
- Constraints: keep infrastructure minimal and use schema-driven validation.
- The system must be easy to develop and test locally.

## Decision
1. **Runtime and language**
   - Node.js + TypeScript for both server and shared workflow core.
2. **API framework**
   - Fastify for lightweight HTTP server and JSON Schema integration.
3. **Storage**
   - SQLite for persistence.
   - Prisma for schema migrations and type-safe access.
4. **Package layout**
   - `packages/workflow-core`: DSL types, JSON Schemas, runner, built-in nodes.
   - `apps/server`: REST API and persistence.
   - `apps/web` (optional MVP): minimal JSON editor UI.
5. **Specification format**
   - JSON Schema draft 2020-12 for DSL and API contracts.
6. **Execution model**
   - Serial topological execution (no parallelism in MVP).

## Consequences
- **Pros:** Simple local setup, strong schema validation, clear separation of concerns.
- **Cons:** Limited scalability; no parallel execution; minimal UI scope.
- **Impact:** Repository will be organized around the package layout above. All implementation must trace back to schema definitions.

## Change Summary (Record)
- **Why:** Establish a stable, minimal architecture for the workflow MVP.
- **What:** Selected Node.js + TypeScript + Fastify + SQLite/Prisma; schema-first approach; monorepo layout with workflow-core.
- **Impact:** Implementation will be guided by JSON Schemas and modular packages, enabling traceability from spec to code.
