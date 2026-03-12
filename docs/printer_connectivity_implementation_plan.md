# Printer Connectivity Implementation Plan

## Objective

Implement a printer connectivity system where connectors collect printer data (v1: Bambu Lab local mode), stream data to the server via WebSocket, persist important status transitions in the database, and expose low-latency read-only telemetry to the web app via SSE.

This plan is written so a team of AI agents can execute it milestone by milestone with clear boundaries.

## Scope and Constraints

- Multi-tenant support must be preserved in every model and endpoint.
- First iteration printer platform: Bambu Lab local mode.
- Optional read-only mode in v1: support limited Bambu status reads without requiring local mode, where technically feasible.
- Data ingestion transport: connector -> backend WebSocket.
- Data fanout transport: backend -> UI SSE for non-critical telemetry.
- Durable storage only for important events (status changes, print lifecycle, file/job identifiers, failures).
- Credentials must be encrypted at rest.
- Three connector runtimes:
  - In-app browser connector (inside this repo)
  - Chrome extension connector (separate repo)
  - Go connector service (separate repo)
- Add a file management feature where a printing file can be assigned to one or many project parts with an explicit "units printed per file run" value.

## Data Classification Rules

### Durable (store in DB long-term)

- Printer status transitions: `OFFLINE`, `IDLE`, `PRINTING`, `PAUSED`, `ERROR`, `MAINTENANCE`.
- Print lifecycle events: print started/paused/resumed/completed/failed/cancelled.
- File/job metadata: source file name, platform job identifier, elapsed/estimated duration.
- Error events and disconnect reasons.
- Connector identity and connection audit.
- Connector assignment and failover decisions for auditability.

### Ephemeral (stream via SSE, no DB retention)

- Hotend temperature, bed temperature.
- Progress percent updates.
- Fan speed, layer counts, current speed/feed if available.
- Lightweight heartbeat telemetry.

## Proposed Architecture

1. Connector discovers/receives assigned printers and normalizes platform data.
2. Connector opens authenticated WebSocket session to backend ingest endpoint.
3. Backend validates connector + tenant, ingests normalized events.
4. Backend writes durable events to DB and updates latest snapshot per printer.
5. Backend publishes ephemeral telemetry to in-memory pub/sub.
6. UI subscribes to SSE endpoint per tenant/printer for real-time non-durable telemetry.

## Database Plan (Prisma)

Existing `Printer` and `PrintJob` models remain primary business entities. Add connectivity-focused models without overloading core tables.

### New Enums

- `PrinterPlatform`: `BAMBU_LAB`
- `ConnectorRuntime`: `WEB_APP`, `CHROME_EXTENSION`, `GO_AGENT`
- `ConnectorAuthType`: `SESSION`, `API_TOKEN`
- `PrinterEventType`: `STATUS_CHANGED`, `PRINT_STARTED`, `PRINT_PROGRESS`, `PRINT_PAUSED`, `PRINT_RESUMED`, `PRINT_COMPLETED`, `PRINT_FAILED`, `PRINT_CANCELLED`, `CONNECTOR_CONNECTED`, `CONNECTOR_DISCONNECTED`, `ERROR`
- `ConnectionState`: `CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `UNHEALTHY`
- `BambuAccessMode`: `LOCAL_FULL`, `READ_ONLY_FALLBACK`

### New Models

1. `PrinterConnection`
   - Purpose: platform-agnostic connection config for a printer.
   - Key fields:
     - `id`, `tenantId`, `printerId`
     - `platform PrinterPlatform`
     - `host`, `port`, `path`, `useTls`
     - `authType` (platform-side auth mode string)
     - `credentialsEncrypted Json` (ciphertext + metadata only)
     - `capabilities Json?` (e.g. supports webcam, job list, progress granularity)
     - `isEnabled`, `createdAt`, `updatedAt`, `lastValidatedAt`
   - Indexes:
     - `(tenantId, platform, isEnabled)`
     - unique `(printerId, platform)` for first iteration

2. `ConnectorAgent`
   - Purpose: identifies a specific connector installation/runtime.
   - Key fields:
     - `id`, `tenantId`
     - `runtime ConnectorRuntime`
     - `name` (user-defined)
     - `fingerprint` (stable runtime fingerprint)
     - `version`, `lastSeenAt`, `isRevoked`
   - Indexes:
     - `(tenantId, runtime, isRevoked)`
     - unique `(tenantId, fingerprint)`

3. `ConnectorSession`
   - Purpose: auditable WebSocket connection session.
   - Key fields:
     - `id`, `tenantId`, `connectorAgentId`
     - `connectedAt`, `disconnectedAt`, `disconnectReason`
     - `remoteAddr`, `userAgent`, `state ConnectionState`
     - `stats Json?` (events received, dropped, avg latency)
   - Indexes:
     - `(tenantId, connectedAt desc)`
     - `(connectorAgentId, connectedAt desc)`

4. `PrinterEvent`
   - Purpose: durable, queryable printer event timeline.
   - Key fields:
     - `id`, `tenantId`, `printerId`
     - `connectorSessionId`
     - `eventType PrinterEventType`
     - `printerStatus PrinterStatus?`
     - `platformJobId`, `fileName`
     - `payload Json` (normalized event body)
     - `occurredAt`, `ingestedAt`
   - Indexes:
     - `(tenantId, printerId, occurredAt desc)`
     - `(tenantId, eventType, occurredAt desc)`
     - `(platformJobId)` nullable index

5. `PrinterLiveState` (snapshot table)
   - Purpose: current known state per printer for fast reads.
   - Key fields:
     - `printerId` (PK/unique), `tenantId`
     - `status PrinterStatus`
     - `platformJobId`, `fileName`
     - `lastHeartbeatAt`, `updatedAt`
     - `lastError String?`
   - Indexes:
     - unique `(printerId)`
     - `(tenantId, status)`
     - `(tenantId, updatedAt desc)`

6. `ConnectorToken` (for API token auth; required for extension and Go)
   - Purpose: long-lived token records with revocation and scopes.
   - Key fields:
     - `id`, `tenantId`, `connectorAgentId?`
     - `name`, `tokenHash`, `prefix`, `scopes Json`
     - `expiresAt?`, `lastUsedAt?`, `revokedAt?`
     - `createdByUserId`, `createdAt`
   - Indexes:
     - unique `(tokenHash)`
     - `(tenantId, revokedAt, expiresAt)`

7. `PrinterReporterLease`
   - Purpose: enforce single active reporter connector per printer with controlled failover.
   - Key fields:
     - `id`, `tenantId`, `printerId`
     - `activeConnectorAgentId`
     - `leaseVersion Int`
     - `leaseExpiresAt`
     - `lastSwitchReason` (heartbeat timeout, manual reassignment, connector revoked)
     - `updatedAt`
   - Rules:
     - only one active lease per printer
     - lease renewed by heartbeat from active reporter
     - when lease expires, server can reassign to another eligible connector
   - Indexes:
     - unique `(printerId)`
     - `(tenantId, leaseExpiresAt)`

8. `PrintFile`
   - Purpose: tenant-managed printable file catalog (the files to track and map to parts).
   - Key fields:
     - `id`, `tenantId`
     - `name` (display name)
     - `storageType` (local path, URL, object storage key, platform-native id)
     - `storageRef` (opaque reference/path/url)
     - `platform PrinterPlatform?` (nullable for generic files)
     - `externalFileId?` (platform-specific file identifier)
     - `notes?`, `isActive`, `createdAt`, `updatedAt`
   - Indexes:
     - `(tenantId, isActive, updatedAt desc)`
     - `(tenantId, platform, externalFileId)` nullable composite

9. `PartPrintFile`
   - Purpose: many-to-many mapping between `ProjectPart` and `PrintFile`, including production yield per run.
   - Key fields:
     - `id`, `tenantId`
     - `partId`, `printFileId`
     - `unitsPerRun Int` (example: one keychain plate gcode produces 30 units)
     - `isDefault Boolean` (default file for automated suggestions, optional)
     - `createdAt`, `updatedAt`
   - Rules:
     - `unitsPerRun` must be >= 1
   - Indexes:
     - unique `(partId, printFileId)`
     - `(tenantId, partId)`
     - `(tenantId, printFileId)`

## Security and Credentials Plan

- Encrypt platform credentials before writing DB (`credentialsEncrypted` only).
- Store encryption key in environment/secret manager; define key rotation workflow.
- Never return decrypted credentials from API responses.
- Mask sensitive values in logs and UI.
- Login/API token strategy:
  - Web app connector: session-based auth (existing app auth).
  - Chrome extension: API token auth.
  - Go connector: API token auth.
  - optional extension sign-in UX can be used only to create/retrieve token once; ingest still uses token.
- Add connector scopes (example):
  - `connectors:ingest`
  - `printers:read-assigned`
  - `printers:telemetry:write`

## API and Transport Design

### WebSocket Ingest Endpoint (Backend)

- Endpoint: `wss://.../api/connectors/ws`
- Auth:
  - Session token (web app connector) or bearer API token (extension/go).
- Handshake:
  - connector identifies runtime/version/fingerprint.
  - backend returns accepted printer assignments, reporter role per printer (`ACTIVE` or `STANDBY`), and heartbeat interval.
- Message contract (versioned):
  - envelope: `schemaVersion`, `type`, `timestamp`, `tenantId`, `printerExternalId`, `payload`.
- Required message types:
  - `heartbeat`
  - `printer.status`
  - `print.lifecycle`
  - `printer.telemetry`
  - `connector.error`
- Server control messages:
  - `reporter.promote` (standby connector becomes active reporter for a printer)
  - `reporter.demote` (active connector stops reporting for a printer)
  - `assignments.update` (full assignment refresh)

### SSE Endpoint (Backend -> UI)

- Endpoint example: `GET /api/printers/live?printerId=...` (or tenant-level multiplexed stream).
- Emits only non-durable telemetry by default:
  - temps, progress, current speed.
- Include reconnect support:
  - event IDs + `Last-Event-ID`
  - heartbeat comment/ping every N seconds.
- Add a multiplexed endpoint for dashboard/global views:
  - `GET /api/printers/live/all`
  - streams telemetry for all printers visible to the tenant/user in a single SSE connection
  - supports optional query filters (`status`, `printerIds`, `updatedSince`) to reduce noise.

### Internal Processing

- Normalize platform payloads into canonical schema.
- Upsert `PrinterLiveState` for durable state only (status, file, lifecycle pointers, heartbeat/error).
- Persist `PrinterEvent` only when event is durable or state transition occurs.
- Do not persist non-important telemetry to DB (temps, fan speed, high-frequency progress).
- Deduplicate high-frequency duplicate telemetry packets in-memory before SSE fanout.
- When a print lifecycle event includes a file identifier, resolve it to `PrintFile` and then to mapped `ProjectPart` entries for planning/traceability.
- Publish telemetry to channel keys that support both:
  - printer-scoped subscriptions (`tenant:{tenantId}:printer:{printerId}`)
  - tenant-scoped subscriptions (`tenant:{tenantId}:printers:all`).
- Enforce `PrinterReporterLease` gate so only the active reporter's stream is accepted for each printer.

## Milestones

## Milestone 0 - Foundation and Contract Definition

Goal: lock architecture, schemas, and event contracts before coding connectors.

Feature set:
- Finalize canonical printer event schema (`schemaVersion = 1`).
- Define platform mapping matrix (Bambu local mode v1).
- Define optional read-only fallback contract for Bambu without local mode (limited fields + degraded capabilities).
- Create DB migration spec for all new models/enums/indexes.
- Define auth model and token scopes.
- Define SLA targets:
  - heartbeat timeout
  - reconnect backoff policy
  - max acceptable ingest latency.
- Define client ownership boundaries:
  - one client account can register multiple connectors
  - each connector can monitor multiple printers
  - connector/printer assignment cannot cross client boundary.
- Define single-active-reporter failover policy and lease timings.

Deliverables:
- ADR document for transport and persistence rules.
- Prisma migration plan reviewed.
- JSON schema (or Zod schema) for WebSocket messages.
- Threat model checklist for connector auth and credential storage.

Acceptance criteria:
- Event schema and DB design approved.
- No unresolved open questions in data mapping.

## Milestone 1 - Backend Ingestion, Persistence, and SSE

Goal: production-ready backend ingest pipeline without external connector repos yet.

Feature set:
- Implement WebSocket ingest endpoint.
- Implement auth guards (session + API token).
- Implement event normalization layer.
- Implement durable event persistence (`PrinterEvent`) and snapshot updates (`PrinterLiveState`).
- Implement SSE endpoint for live telemetry.
- Implement SSE all-printers multiplexed endpoint for dashboards using one connection per tenant session.
- Implement single-active-reporter orchestration with standby connectors:
  - lease acquisition/renewal
  - heartbeat timeout detection
  - server-issued promote/demote commands
- Implement admin APIs:
  - manage `PrinterConnection`
  - generate/revoke `ConnectorToken`
  - register/revoke `ConnectorAgent`
- Add file management APIs:
  - CRUD `PrintFile`
  - CRUD `PartPrintFile` mappings with `unitsPerRun`
  - validation to enforce tenant isolation and `unitsPerRun >= 1`
- Add monitoring:
  - per-tenant event throughput
  - dropped message counter
  - active connector sessions.

Test plan:
- Unit tests for normalization and event classification.
- Integration tests for WebSocket handshake/auth failures/success.
- SSE reconnect behavior tests.
- SSE all-printers fanout tests (single event source -> multiple dashboard consumers).
- Failover tests for reporter lease timeout and promotion.
- DB migration + rollback validation.

Acceptance criteria:
- Backend can ingest synthetic events and reflect live data via SSE.
- Durable events are queryable and accurate.
- Security checks pass (token revocation effective, no secrets leaked).
- Only one connector can report per printer at any moment; standby takeover works after disconnect.
- Non-important telemetry is not retained in DB.

## Milestone 2 - In-App Web Connector (This Repo)

Goal: ship browser-based connector that runs when app is open and sends printer data.

Feature set:
- Build connector bootstrap module loaded on authenticated app open.
- Fetch assigned printer connection configs from backend.
- Implement platform adapters:
  - Bambu local adapter v1
  - optional Bambu read-only fallback adapter (reduced telemetry/lifecycle detail)
- Implement WebSocket client to backend ingest endpoint.
- Implement local retry/reconnect strategy:
  - per-printer connection retries
  - backend WS reconnect with jittered exponential backoff.
- Respect server reporter role:
  - report only when assigned `ACTIVE`
  - stay connected as `STANDBY` when instructed.
- Add UI visibility:
  - connector health indicator
  - per-printer connection state badges.
- Update dashboard data layer to prefer `GET /api/printers/live/all` instead of opening one SSE stream per printer.
- Add file management UI:
  - screen to create/manage printable files
  - assignment UI to map each file to one or many project parts
  - input for `unitsPerRun` (for batch plates like "30 keychains per file")
  - allow multiple files per part to support printer/profile ecosystem variants
  - mark one mapping as default for each part when applicable
- Use mappings during planning views:
  - show expected file runs required to fulfill part quantity (`ceil(requiredUnits / unitsPerRun)`).

Operational constraints:
- Connector should pause when tab is inactive for long periods only if explicitly desired; otherwise keep alive.
- Handle browser permission/network errors gracefully.

Acceptance criteria:
- With app open, assigned printers stream into backend.
- Printer state updates in near real-time.
- No UI crashes when printer endpoints are unreachable.

## Milestone 3 - Chrome Extension Connector (Separate Repo)

Goal: standalone browser connector not tied to the app tab lifecycle.

Feature set:
- New repo scaffold:
  - extension manifest, background service worker, options/login UI.
- API token flow:
  - token provisioning UX (manual paste or one-time secure exchange).
  - secure token storage strategy in extension context.
- Fetch printer assignments and connection configs.
- Reuse canonical adapters/event schema from Milestones 0-2.
- Maintain persistent backend WS from extension background context.
- Add extension-level diagnostics page:
  - connected printers
  - last event sent
  - auth expiration state.

Backend dependencies:
- Connector token issue/revoke endpoints and scope validation.
- Token introspection/revocation propagation to active WS sessions.

Acceptance criteria:
- Extension keeps streaming even without active app tab.
- User can provision/revoke API tokens securely.
- Revoked credentials immediately stop ingestion.

## Milestone 4 - Go Connector Agent (Separate Repo)

Goal: deployable Linux/Docker connector for always-on server-side ingestion.

Feature set:
- New Go module with:
  - config loader (env/file)
  - structured logger
  - health endpoint
  - graceful shutdown.
- API token auth flow (primary).
- Poll/stream adapters for Bambu local mode (v1), optional read-only fallback mode.
- WebSocket client to backend with:
  - heartbeat
  - local queue buffer for transient disconnects
  - reconnect + replay strategy (bounded).
- Packaging:
  - Dockerfile
  - example docker-compose
  - Linux service example.

Operational requirements:
- Stable memory usage under N printers.
- Configurable per-printer polling intervals.
- Metrics export (Prometheus text endpoint optional in v1.1).

Acceptance criteria:
- Runs unattended for 72h test window.
- Recovers from backend/printer restarts automatically.
- Data parity with browser connector for core status events.

## Milestone 5 - Hardening, Observability, and Rollout

Goal: safely launch and operate multi-connector ecosystem.

Feature set:
- Rate limits and message size limits on ingest endpoint.
- Per-tenant quotas and abuse safeguards.
- Dead-letter strategy for malformed events.
- Dashboards and alerts:
  - disconnect spikes
  - stale heartbeat
  - ingestion lag.
- Data retention policies:
  - keep `PrinterEvent` for X months
  - no DB retention for non-important telemetry (SSE only).
- Data quality safeguards for file mapping:
  - detect stale mappings (inactive file still marked default)
  - prevent delete of `PrintFile` while active mappings exist unless explicitly unlinked.
- Controlled rollout:
  - internal tenant -> pilot tenants -> general availability.

Acceptance criteria:
- On-call runbook documented.
- Rollback strategy validated.
- Pilot success metrics met.

## Work Breakdown for AI Agent Team

Recommended parallel streams:

1. Schema and migrations agent
   - Implement Prisma enums/models/indexes.
   - Produce migration + rollback notes.

2. Backend ingest agent
   - WebSocket endpoint, auth, normalization, persistence.

3. Streaming agent
   - SSE endpoint and pub/sub fanout.

4. Web connector agent
   - In-app runtime loader, adapters, retry logic.

5. Security/auth agent
   - connector login/token APIs, encryption service, revocation.

6. QA/reliability agent
   - integration tests, load tests, reconnect chaos tests.

## Trackable Task Lists (Checkboxes)

Use these checklists for execution tracking. Keep each item checked only when merged and validated in the target environment.

### Milestone 0 - Foundation and Contract Definition

- [ ] Lock canonical WebSocket message schema (`schemaVersion = 1`) and publish examples.
- [ ] Document Bambu local-mode field mapping to canonical model.
- [ ] Document Bambu read-only fallback mapping and explicitly mark unsupported fields.
- [ ] Finalize tenant/client ownership rules for connectors and printers (no cross-client assignment).
- [ ] Finalize single-active-reporter lease policy (timeouts, renewal cadence, promotion rules).
- [ ] Finalize API token scopes for extension and Go connector.
- [ ] Produce Prisma migration spec for new enums/models/indexes.
- [ ] Publish ADR for retention policy (durable events only, telemetry SSE-only).
- [ ] Approve threat model for token handling and credential encryption.

### Milestone 1 - Backend Ingestion, Persistence, and SSE

- [ ] Implement `wss` connector ingest endpoint with auth guard (session or API token).
- [ ] Implement connector handshake response with assignment + reporter role (`ACTIVE`/`STANDBY`).
- [ ] Implement server control messages: `reporter.promote`, `reporter.demote`, `assignments.update`.
- [ ] Implement normalization pipeline for Bambu local events.
- [ ] Implement normalization pipeline for Bambu read-only fallback events (degraded mode).
- [ ] Implement durable event writes to `PrinterEvent`.
- [ ] Implement `PrinterLiveState` updates for durable state only (no temp/fan persistence).
- [ ] Implement reporter lease enforcement via `PrinterReporterLease`.
- [ ] Implement printer-scoped SSE endpoint (`/api/printers/live`).
- [ ] Implement all-printers SSE endpoint (`/api/printers/live/all`) with filters.
- [ ] Implement in-memory telemetry dedupe and fanout (no DB retention for telemetry).
- [ ] Implement admin APIs for `PrinterConnection`, `ConnectorAgent`, `ConnectorToken`.
- [ ] Implement file management APIs for `PrintFile` and `PartPrintFile` + `unitsPerRun` validation.
- [ ] Add integration tests for handshake, auth, lease failover, and SSE reconnect.
- [ ] Add regression tests proving non-important telemetry is not stored in DB.

### Milestone 2 - In-App Web Connector (This Repo)

- [ ] Add connector bootstrap to load when authenticated app is open.
- [ ] Fetch assigned printers and connection metadata from backend.
- [ ] Implement Bambu local adapter.
- [ ] Implement optional Bambu read-only fallback adapter.
- [ ] Implement backend WebSocket client with heartbeat and reconnect backoff.
- [ ] Implement role-aware behavior (`ACTIVE` reports, `STANDBY` monitors and waits).
- [ ] Add dashboard data layer usage of `/api/printers/live/all` (single SSE stream).
- [ ] Add connector health indicator UI.
- [ ] Add per-printer connection/reporter status badges.
- [ ] Build file management screen for `PrintFile` CRUD.
- [ ] Build part-to-file assignment UI (`PartPrintFile`) with `unitsPerRun`.
- [ ] Support multiple files per part and default-file selection rule.
- [ ] Show computed run count in planning (`ceil(requiredUnits / unitsPerRun)`).
- [ ] Add UI tests for mapping, validation, and fallback-mode visibility.

### Milestone 3 - Chrome Extension Connector (Separate Repo)

- [ ] Scaffold extension repo (manifest, background worker, settings/options UI).
- [ ] Implement API token provisioning UX (manual paste or one-time secure exchange).
- [ ] Implement secure token storage and revocation handling.
- [ ] Implement assignment fetch and refresh.
- [ ] Implement Bambu local adapter parity with web connector.
- [ ] Implement optional read-only fallback parity.
- [ ] Implement persistent WS client in background context.
- [ ] Implement reporter role handling (`ACTIVE` vs `STANDBY`).
- [ ] Build diagnostics page (connected printers, reporter role, last event, token state).
- [ ] Add tests for token revocation immediate disconnect behavior.

### Milestone 4 - Go Connector Agent (Separate Repo)

- [ ] Scaffold Go module with config loader and structured logging.
- [ ] Implement health endpoint and graceful shutdown.
- [ ] Implement API token auth to ingest WebSocket endpoint.
- [ ] Implement Bambu local adapter.
- [ ] Implement optional read-only fallback adapter.
- [ ] Implement reconnect with exponential backoff and heartbeat.
- [ ] Implement role-aware reporting (`ACTIVE` only).
- [ ] Implement bounded local queue for short disconnect windows.
- [ ] Add Dockerfile and example compose/service configs.
- [ ] Add long-run reliability test (72h target) and memory profile checks.

### Milestone 5 - Hardening, Observability, and Rollout

- [ ] Add ingest endpoint rate limits and payload size limits.
- [ ] Add per-tenant quotas and overload safeguards.
- [ ] Add dead-letter handling for malformed/unsupported events.
- [ ] Add dashboards: active connectors, lease switches, stale heartbeats, ingest lag.
- [ ] Add alerts for disconnect spikes and frequent failovers.
- [ ] Enforce retention job for `PrinterEvent` history window.
- [ ] Verify and enforce no DB retention for non-important telemetry.
- [ ] Add safeguards for stale/default `PartPrintFile` mappings.
- [ ] Block `PrintFile` deletion while active mappings exist (unless explicitly unlinked).
- [ ] Execute rollout phases: internal -> pilot -> general availability.
- [ ] Publish on-call runbook and rollback playbook.

### Cross-Cutting Tasks (Run Throughout)

- [ ] Keep API contracts versioned and backward compatible.
- [ ] Keep structured audit logs for token use, lease switches, and connector sessions.
- [ ] Validate tenant/client isolation in every endpoint and query.
- [ ] Maintain migration rollback notes for every schema change.
- [ ] Keep end-to-end smoke test suite green for all active milestones.

## Open Decisions (Must Be Resolved in Milestone 0)

- Exact Bambu read-only fallback capability boundary (if local mode is unavailable).
- Whether file auto-discovery/import from connector should start in v2 as user-triggered action only.
- Whether one part can have multiple defaults by printer/platform profile or only one global default.

## Suggested Definition of Done (Program Level)

- Tenant admin can configure Bambu printer connections (local mode) and optional read-only fallback where possible.
- At least one connector runtime can connect and ingest data end-to-end.
- Printer statuses are durable and historically queryable.
- Live non-important telemetry (temps/progress/fan) is visible in UI through SSE with low latency and not stored in DB.
- Team can manage printable files and map each file to one or many parts with `unitsPerRun`.
- Planning and production workflows can compute run count from part demand and mapped file yield.
- Chrome extension and Go connector each deliver parity for core lifecycle events.
- Security model validated with token revocation and credential encryption tests.
- Ownership model enforced: one client account -> multiple connectors -> multiple printers, with no cross-client assignment.
- Single active reporter per printer enforced, with automatic standby promotion on connection loss.
