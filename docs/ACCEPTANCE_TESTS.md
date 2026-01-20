# Acceptance Tests v0.1

All tests use a valid API key and the REST endpoints in docs/API.md.  
Each test lists the related spec clause IDs.

## AT-1: Create -> Edit -> Publish -> Production Run -> Run Detail

**Given**
- A valid API key.
- A workflow graph that passes validation (Section 3 in SDD).

**When**
1. `POST /v1/workflows` with Example A graph.
2. `PUT /v1/workflows/{id}/draft` with an updated graph (e.g., add a transformer node).
3. `POST /v1/workflows/{id}/publish`.
4. `POST /v1/runs` with `mode=production`.
5. `GET /v1/runs/{run_id}?include_steps=true`.

**Then**
- Create response contains `workflow` and `draft`.
- Publish response contains a `published` version.
- Run completes with status `succeeded` and has output from the end node.
- Run detail includes ordered steps with input/output snapshots.

**Spec refs**
- SDD-DSL-1, SDD-DSL-7, SDD-EXEC-2, SDD-EXEC-3, SDD-EXEC-6
- SDD-OBS-3, SDD-OBS-4
- API-WF-1, API-WF-6, API-WF-7, API-RUN-1, API-RUN-2

## AT-2: Debug Run Uses Draft and Exposes Node I/O

**Given**
- A workflow with a draft version different from the latest published version.

**When**
1. `POST /v1/runs` with `mode=debug`.
2. `GET /v1/runs/{run_id}?include_steps=true`.

**Then**
- The run references the draft version.
- Each step includes `input_snapshot` and `output_snapshot`.

**Spec refs**
- SDD-VAR-5, SDD-OBS-4
- API-RUN-1, API-RUN-2

## AT-3: HTTP Node Failure Fails Run and Error Is Traceable

**Given**
- A workflow that includes an HTTP node with `url` pointing to a blocked private IP (e.g. `http://127.0.0.1`).

**When**
1. Publish the workflow.
2. `POST /v1/runs` with `mode=production`.
3. `GET /v1/runs/{run_id}?include_steps=true`.

**Then**
- Run status is `failed`.
- The HTTP node RunStep is `failed` with error code `SSRF_BLOCKED` or `HTTP_REQUEST_FAILED`.
- Run error references the failing node.

**Spec refs**
- SDD-NODE-HTTP-1, SDD-EXEC-5, SDD-OBS-4, SDD-SEC-2
- API-RUN-1, API-RUN-2

## AT-4: Condition Branch Selection

**Given**
- A workflow with a condition node and two branches (true/false).
- Inputs that make the condition true.

**When**
1. Run the workflow (debug or production).
2. Fetch run details with steps.

**Then**
- Nodes on the true branch execute successfully.
- Nodes on the false branch are marked `skipped`.

**Spec refs**
- SDD-EXEC-4, SDD-NODE-COND-1, SDD-OBS-5
- API-RUN-1, API-RUN-2
