# Connector Threat Model

**Date:** 2026-03-11
**Status:** Draft

Threat model checklist for the printer connectivity system. Covers the connector ingest path, credential storage, token lifecycle, and lease arbitration. Each item identifies the threat, the mitigation design, and its current implementation status.

---

## Scope

This model covers:
- `ConnectorAgent` registration and authentication
- `ConnectorToken` issuance and validation
- WebSocket ingest endpoint
- `PrinterConnection` credential storage
- `PrinterReporterLease` enforcement
- SSE fanout to UI

Out of scope for this milestone: network-layer controls (TLS termination, firewall rules), Bambu cloud account credential management, user authentication (covered by NextAuth.js).

---

## Threats

### T1: Credential Theft from DB

**Threat:** An attacker who gains read access to the database retrieves plaintext printer credentials (`hostname`, `accessCode`, `mqttPassword`) stored in `PrinterConnection`, enabling them to connect to customer printers directly.

**Mitigation:**
- Printer credentials are stored only as ciphertext in the `credentialsEncrypted` JSON field on `PrinterConnection`.
- The encryption key is stored in the environment/secret manager (e.g., environment variable, Vault, AWS Secrets Manager) and is never written to the database.
- The application decrypts credentials only at the moment a `ConnectorAgent` requests its assigned connection config, and the plaintext is held in memory for the minimum required duration.
- DB backups and replicas do not contain recoverable credentials without the key.

**Status:** [ ] Encryption service implementation pending (Milestone 1)

---

### T2: API Token Leakage

**Threat:** A raw API token is exposed in application logs, error messages, API responses, or UI rendering, allowing an attacker to authenticate as the affected connector.

**Mitigation:**
- The raw token is returned only once, in the HTTP response body of the token creation endpoint, over TLS.
- Only `tokenHash` (SHA-256 of the raw token) is stored in the database; the raw token cannot be retrieved from any API or DB query after creation.
- `ConnectorToken.prefix` (the first 8 characters) is stored for display in revocation UIs; this prefix has insufficient entropy to brute-force the full token.
- Application code must never log raw tokens. Log `ConnectorToken.id` or `prefix` for traceability.
- API responses for token list and detail endpoints return `prefix`, `scopes`, and metadata — not the raw token.

**Status:** [x] Contract defined in schema and `token-scopes.md`

---

### T3: Cross-Tenant Data Access via Connector

**Threat:** A connector authenticated to Tenant A submits events for a `PrinterConnection` belonging to Tenant B, injecting false data into another tenant's printer state.

**Mitigation:**
- Every ingest message payload includes a `tenantId` field.
- The ingest endpoint validates that the `tenantId` in the message matches the `tenantId` associated with the authenticated `ConnectorToken` or session.
- `PrinterConnection` lookups on the ingest path filter by `tenantId` at the query level; a printer belonging to a different tenant is treated as not found (404-equivalent WebSocket error frame).
- Multi-tenant isolation is enforced at the ORM query layer (Prisma); no cross-tenant join is possible through normal application code paths.

**Status:** [ ] Validation logic pending (Milestone 1)

---

### T4: Replay Attacks on WebSocket Ingest

**Threat:** An attacker captures a valid signed or authenticated WebSocket message and replays it at a later time to inject false printer events (e.g., replaying a `PRINTING` status to obscure that a printer is actually offline).

**Mitigation:**
- All WebSocket traffic is over TLS; passive capture requires breaking TLS.
- Each ingest message includes a `timestamp` field (ISO 8601 / Unix ms). The server rejects messages with a timestamp older than 60 seconds relative to server time.
- Each WebSocket session is assigned a unique `connectorSessionId` at connection time. Messages must include the `connectorSessionId`; the server validates it matches the current active session. A message from a previous session's ID is rejected.
- Revoked sessions are rejected immediately on the next message or heartbeat; replay using a revoked session's token is rejected at the token validation step.

**Status:** [ ] Timestamp validation pending (Milestone 1)

---

### T5: Reporter Spoofing (Fake Active Reporter)

**Threat:** A connector that is not the active reporter submits printer events as if it were, corrupting the printer's live state or injecting false status transitions.

**Mitigation:**
- `PrinterReporterLease` is checked per-message on the ingest endpoint for all non-heartbeat event types.
- Only the connector whose `ConnectorAgent.id` matches `PrinterReporterLease.activeConnectorAgentId` for the target printer may submit `printer.status`, `printer.telemetry`, and `printer.event` frames.
- Non-active connectors receive a `reporter.not-active` error frame and must transition to STANDBY mode.
- The lease is tied to a specific `connectorSessionId`; if the active reporter reconnects and a new session is established, the server re-validates lease ownership against the new session before accepting events.
- On reconnect before lease expiry: server re-grants the lease to the new session from the same `ConnectorAgent` without running promotion sequence. See `lease-policy.md` Reconnect Window Policy.

**Status:** [ ] Lease gate implementation pending (Milestone 1)

---

### T6: Token Scope Escalation

**Threat:** A connector token issued with limited scopes (e.g., `connector-readonly`) is used to access endpoints requiring elevated scopes (e.g., the ingest endpoint requiring `connectors:ingest`), bypassing the intended restriction.

**Mitigation:**
- Each API endpoint declares its required scope(s). The token validation middleware checks that all required scopes are present in `ConnectorToken.scopes` (a JSON array) before allowing the request.
- Scope checks are per-request; there is no session-level scope caching that could be stale after token modification.
- Scope bundles expand to individual scopes at token creation time; there is no implicit scope inheritance or wildcard matching.
- Token validation failures return HTTP 401 with no scope detail to avoid information disclosure.

**Status:** [ ] Scope validation implementation pending (Milestone 1)

---

### T7: Connector Agent Impersonation

**Threat:** An attacker registers a new `ConnectorAgent` using a known fingerprint value (e.g., obtained from observing network traffic or reading connector source code) to steal a lease held by a legitimate agent.

**Mitigation:**
- A unique constraint on `(tenantId, fingerprint)` in `ConnectorAgent` prevents two agents from registering the same fingerprint within the same tenant.
- Fingerprint is a stable runtime-derived value (e.g., machine ID, browser installation ID) that an attacker must control at the OS/browser level to replicate.
- An admin approval flow for new agent registration is recommended: new agents should enter a `PENDING` state and require explicit admin activation before they can claim leases or submit events.

**Status:** [ ] Admin approval flow deferred (Milestone 1 or later)

---

### T8: Encryption Key Rotation Gap

**Threat:** The encryption key used for `credentialsEncrypted` is compromised. Because all credentials are encrypted with a single key, all tenant printer credentials are exposed until the key is rotated and existing ciphertext is re-encrypted.

**Mitigation:**
- Define a key rotation workflow before the encryption service is put into production:
  1. Generate a new encryption key and load it into the secret manager alongside the old key.
  2. Run a migration script that reads each `PrinterConnection.credentialsEncrypted`, decrypts with the old key, re-encrypts with the new key, and writes back.
  3. Once all rows are migrated, remove the old key from the secret manager.
  4. Verify no application instances hold the old key in memory (rolling restart).
- The rotation script should be part of the database migration tooling and must run in a transaction with a verification step before committing.
- Key versions should be embedded in the ciphertext envelope (e.g., `v1:<base64ciphertext>`) so the application can identify which key to use for decryption during rotation windows.

**Status:** [ ] Key rotation workflow pending (post-Milestone 1)

---

## Status Summary

| ID | Threat | Implementation Status |
|---|---|---|
| T1 | Credential theft from DB | [ ] Pending Milestone 1 |
| T2 | API token leakage | [x] Contract defined |
| T3 | Cross-tenant data access | [ ] Pending Milestone 1 |
| T4 | Replay attacks on ingest | [ ] Pending Milestone 1 |
| T5 | Reporter spoofing | [ ] Pending Milestone 1 |
| T6 | Token scope escalation | [ ] Pending Milestone 1 |
| T7 | Connector agent impersonation | [ ] Deferred Milestone 1+ |
| T8 | Encryption key rotation gap | [ ] Pending post-Milestone 1 |
