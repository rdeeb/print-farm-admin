# Connector API Token Scopes

**Date:** 2026-03-11
**Status:** Draft

Defines the scope system for API tokens issued to Chrome extension and Go agent connectors. Browser/session-authenticated connectors (WEB_APP runtime) use the session JWT and do not use API tokens.

---

## Scope Definitions

| Scope | Description |
|---|---|
| `connectors:ingest` | Allows the token holder to send event frames to the WebSocket ingest endpoint. This is the primary scope required for any active connector. |
| `printers:read-assigned` | Allows the token holder to fetch `PrinterConnection` configuration records for printers assigned to the connector's agent. Required to retrieve MQTT credentials and connection parameters at startup. |
| `printers:telemetry:write` | Allows the token holder to submit telemetry event frames (`printer.telemetry` type). Checked separately from `connectors:ingest` to allow connectors that only submit status events without telemetry payloads. |
| `connectors:heartbeat` | Allows the token holder to send heartbeat frames. Implied by `connectors:ingest` but separable for tokens that should only maintain liveness without event submission rights (e.g., monitoring probes). |

---

## Scope Bundles

Bundles are convenience presets offered in the token creation UI. They expand to individual scopes stored in `ConnectorToken.scopes`.

| Bundle name | Included scopes | Intended use |
|---|---|---|
| `connector-full` | `connectors:ingest`, `printers:read-assigned`, `printers:telemetry:write`, `connectors:heartbeat` | Standard Chrome extension or Go agent connector. This is the default bundle. |
| `connector-readonly` | `printers:read-assigned`, `connectors:heartbeat` | Monitoring-only agents that read printer configuration and maintain liveness but do not submit printer events. Tokens with this bundle may connect to the WebSocket ingest endpoint as STANDBY connectors (heartbeat-only) but may not submit printer events. |

Selecting a bundle at creation time writes the expanded scope list into `ConnectorToken.scopes` (a JSON array). Bundles are not stored as a value; only the individual scopes are persisted.

---

## Token Format

| Property | Value | Notes |
|---|---|---|
| Prefix | `3dfa_` | Fixed 5-character string identifying the issuer. Makes tokens identifiable in logs and grep output without exposing the token value. |
| Total length | 48 characters | Prefix (5 chars) + 43 randomly generated URL-safe base64 characters. |
| Entropy | 256 bits | 32 random bytes, base64url-encoded to 43 characters, yielding 256 bits of entropy. |
| Storage | SHA-256 hash only | The raw token is never stored. `ConnectorToken.tokenHash` stores `SHA-256(raw_token)` as a hex string. |
| Prefix storage | `ConnectorToken.prefix` | The first 8 characters of the raw token (prefix + first 3 random chars) stored in plaintext for display in revocation UIs without exposing the full token. |

**Issuance flow:**

1. Backend generates 32 random bytes using a CSPRNG and encodes as URL-safe base64 (43 characters).
2. Raw token = `3dfa_` + random chars.
3. Backend computes `tokenHash = hex(SHA-256(rawToken))`.
4. Backend stores `ConnectorToken` row with `tokenHash`, `prefix`, `scopes`, `tenantId`, `connectorAgentId`, `createdAt`.
5. Raw token is returned to the caller **once** in the API response. It is not stored and cannot be retrieved again.
6. Caller must copy and store the raw token immediately. If lost, the token must be revoked and a new one issued.

**Token never logged**: Raw tokens must not appear in application logs, error messages, or API responses after the initial creation response. Log the `ConnectorToken.id` or `prefix` for traceability.

---

## Token Validation

On each authenticated request from a CHROME_EXTENSION or GO_AGENT connector:

1. Extract the `Authorization: Bearer <token>` header.
2. Compute `SHA-256(token)` and look up `ConnectorToken` by `tokenHash`.
3. Reject if no matching record, or if `revokedAt IS NOT NULL`, or if `expiresAt < now` (when expiry is set).
4. Verify the required scope(s) for the endpoint are present in `ConnectorToken.scopes`.
5. Verify `ConnectorToken.tenantId` matches the tenant context of the request.

All validation failures return HTTP 401 with no detail beyond "unauthorized" to avoid oracle attacks.

---

## Revocation

To revoke a token, set `ConnectorToken.revokedAt = now`. This is the only revocation mechanism; tokens are not deleted.

**Effect on active sessions:**

- Active WebSocket sessions that authenticated with the revoked token must be terminated within one heartbeat interval (15 seconds).
- The server checks `revokedAt` on each heartbeat frame received from the session. On the first heartbeat after revocation, the server sends a `session.revoked` frame and closes the WebSocket with code 4401.
- The connector must not attempt to reconnect with a revoked token. It should surface a "token revoked" error state to the operator.

**Token listing for revocation UI:**

The revocation UI displays `ConnectorToken.prefix`, `createdAt`, `lastUsedAt`, `scopes`, and revocation status. The raw token is never retrievable or displayed after initial creation.
