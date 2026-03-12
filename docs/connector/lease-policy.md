# Connector Lease Policy: Single Active Reporter

**Date:** 2026-03-11
**Status:** Draft

Describes how the backend arbitrates which connector is the authoritative data source (the "active reporter") for a given printer, and how failover proceeds when the active reporter goes offline.

---

## Terminology

- `printerId` refers to the internal database UUID of the `Printer` record.
- `printerExternalId` is the platform-specific identifier (e.g., Bambu serial number).

---

## Overview

Multiple connector instances (browser tab, Chrome extension, Go agent) may be connected and watching the same printer simultaneously, but only one may submit printer events at a time. The **active reporter** holds a lease — a record in `PrinterReporterLease` that gates event acceptance. All other connected connectors for the same printer operate as **STANDBY** reporters: they maintain heartbeats but their printer events are rejected until they are promoted.

---

## Timing Constants (v1 Defaults)

| Parameter | Value | Notes |
|---|---|---|
| Heartbeat interval | 15 seconds | Server-instructed in lease ACK message; connectors use this default until the first ACK is received. |
| Lease duration | 45 seconds | Three missed heartbeats (3 × 15 s) causes lease expiry. |
| Reconnect backoff base | 1 second | Starting delay after first disconnect. |
| Reconnect backoff multiplier | 2× | Doubles on each successive failure. |
| Reconnect backoff maximum | 30 seconds | Cap; backoff does not grow beyond 30 s. |
| Reconnect jitter | ±20% | Applied multiplicatively to the computed delay to spread reconnect storms. |
| Lease renewal | On any heartbeat | Any heartbeat message from the active reporter resets the 45 s expiry clock. |

---

## Ownership Rules

1. **One lease per printer**: There is exactly one `PrinterReporterLease` row per `PrinterConnection`. The row always exists (created when the printer is added); `activeConnectorAgentId` is null when no active reporter is currently holding the lease.

2. **Active reporter gating**: The ingest endpoint checks `PrinterReporterLease.activeConnectorAgentId` on every non-heartbeat event. Events from connectors whose `ConnectorAgent.id` does not match the active ID are rejected with a `reporter.not-active` error frame. The connector receiving this error must transition to STANDBY mode.

3. **STANDBY behavior**: A STANDBY connector continues sending heartbeat frames on the normal interval. It may not submit `printer.status`, `printer.telemetry`, or `printer.event` frames. It should silently buffer or discard data rather than disconnecting.

4. **Lease renewal**: The active reporter sends a heartbeat every 15 seconds. The server responds with a `heartbeat.ack` frame that resets the expiry timer. The heartbeat message must include the `connectorSessionId` and `printerId`.

5. **Lease expiry**: If the server does not receive a heartbeat from the active reporter within 45 seconds of the last renewal, the lease is marked expired (`expiresAt < now`). The server immediately begins the promotion sequence (see Failover Sequence below).

6. **STANDBY promotion criteria**: When the active lease expires or is vacated, the server selects the next active reporter from STANDBY connectors by:
   - Filtering to connectors with `status = STANDBY` and a valid (non-revoked) token
   - Sorting by `ConnectorAgent.lastSeenAt` descending (most recently active first)
   - Breaking ties by `ConnectorAgent.createdAt` ascending (oldest agent preferred)
   - Selecting the first result

7. **Manual reassignment**: An admin user may force-switch the active reporter through the management UI. The server sends a `reporter.demote` WebSocket frame to the current active connector, then writes a new `PrinterReporterLease` record pointing to the target connector. The demoted connector must immediately transition to STANDBY and cease submitting printer events.

8. **Connector revocation**: When a `ConnectorAgent` or `ConnectorToken` is revoked:
   - If the agent holds an active lease, the lease must be cleared (set `activeConnectorAgentId = null`) before the agent record can be deleted or the token deactivated. The foreign key uses `Restrict` semantics — deletion is blocked until the lease reference is removed.
   - After clearing the lease, the server immediately runs the promotion sequence.
   - The revoked agent's WebSocket session is terminated within one heartbeat interval (15 s).

---

## Failover Sequence

The following steps occur when the active reporter's lease expires (missed heartbeats) or when the connection is closed cleanly:

1. Server detects lease expiry: `PrinterReporterLease.expiresAt < now` OR active connector WebSocket closes.
2. Server sets `PrinterReporterLease.activeConnectorAgentId = null` and writes a `ConnectorAuditEvent` row with type `LEASE_EXPIRED` or `LEASE_RELEASED`.
3. Server queries eligible STANDBY connectors for this printer (see promotion criteria in rule 6 above).
4. If no eligible STANDBY connectors exist: lease remains vacant. Server emits a `printer.reporter-offline` SSE event to all subscribed UI clients. The printer's live state is frozen until a new connector connects and claims the lease.
5. If one or more STANDBY connectors exist: server selects the highest-priority candidate.
6. Server writes `PrinterReporterLease.activeConnectorAgentId = <candidate.id>` with a new `expiresAt = now + 45s`.
7. Server sends a `reporter.promote` WebSocket frame to the promoted connector. The frame includes `printerId`, `leaseExpiresAt`, and `heartbeatIntervalSeconds`.
8. Promoted connector transitions from STANDBY to ACTIVE mode. It begins submitting printer events and heartbeats on the instructed interval.
9. Server writes a `ConnectorAuditEvent` row with type `LEASE_PROMOTED`.
10. Server emits a `printer.reporter-changed` SSE event to all subscribed UI clients with the new `connectorAgentId`.
11. All remaining STANDBY connectors continue heartbeating. They do not receive a frame about the promotion (they will receive `reporter.not-active` if they attempt to submit events, which is the expected signal to remain in STANDBY).

---

## Reconnect Window Policy

If a connector whose `ConnectorAgent.id` matches `PrinterReporterLease.activeConnectorAgentId` reconnects before lease expiry:

1. The server must re-grant the lease to the new session without running the full promotion sequence.
2. The server sends a `reporter.promote` message with updated `leaseExpiresAt` and `heartbeatIntervalSeconds` to the reconnected session.
3. This re-grant is conditional on the connector authenticating within the remaining lease TTL.
4. If the lease has already expired before reconnect completes, the normal promotion sequence applies.

---

## Session Lifecycle States (Connector Side)

```
CONNECTING → ACTIVE (if lease is vacant or explicitly granted)
CONNECTING → STANDBY (if another connector holds the lease)
ACTIVE → STANDBY (on receipt of reporter.demote or reporter.not-active)
STANDBY → ACTIVE (on receipt of reporter.promote)
ACTIVE → DISCONNECTED (on WebSocket close or unrecoverable error)
STANDBY → DISCONNECTED (on WebSocket close)
DISCONNECTED → CONNECTING (after backoff delay)
```
