# ADR 001: Connector Transport and Telemetry Retention Policy

**Date:** 2026-03-11
**Status:** Accepted

---

## Context

The 3D farm admin system must receive real-time printer state from machines that are typically accessible only on a local network. The backend cannot reach printers directly because:

1. Printers are behind NAT/firewall on the customer's LAN.
2. Bambu Lab local mode uses MQTT on the local network segment — the backend has no routable path to the MQTT broker.
3. Some connectors run inside a browser tab or a Chrome extension; others run as a standalone Go agent on a machine co-located with the printers.

A connector is therefore required as an intermediary: it bridges the printer's local protocol (MQTT, USB serial, etc.) to the backend over an outbound connection the connector itself initiates.

**Why not poll from the backend?**

- The backend cannot initiate a connection to a printer that is behind NAT.
- Even if a VPN or tunnel were used, Bambu local mode MQTT is a push protocol; polling would require a persistent MQTT subscription running inside the backend, which does not scale across tenants and requires the backend to hold printer credentials unencrypted in hot memory.
- Keeping connector logic in user-controlled runtimes (browser, extension, agent) allows credentials to remain on the customer's network.

**Why not HTTP polling from the connector?**

- High-frequency telemetry (temperatures, progress) updated every 1–2 seconds would require a polling interval below 2 s to remain useful, generating substantial request overhead and connection setup cost per cycle.
- HTTP polling is fundamentally unidirectional per-request; the backend cannot push control messages (e.g., `reporter.demote`) to the connector without long-polling or a second channel.

---

## Decision

### Transport: Connector → Backend — WebSocket

Connectors open a persistent WebSocket connection to the backend ingest endpoint. This transport is chosen because:

- **Bidirectional**: The backend must send control messages to the connector (reporter lease promotion/demotion, ACKs, configuration updates). WebSocket enables this without a second channel.
- **Persistent connection with low overhead**: A single TCP connection carries all telemetry frames; no per-message HTTP handshake cost.
- **Heartbeat framing**: WebSocket ping/pong (supplemented by application-level heartbeat messages) provides an unambiguous liveness signal used for lease expiry.
- **Browser and extension compatible**: The WebSocket API is available in browser tabs and Chrome extensions without additional dependencies.
- **SSE was rejected** for this leg because SSE is server-to-client only; a second HTTP channel would be needed for control messages, splitting session state across two connections.
- **HTTP polling was rejected** for this leg due to per-request overhead and inability to receive server push without long-polling.

### Transport: Backend → UI — SSE (Server-Sent Events)

The backend fans out live telemetry to the UI over SSE. This transport is chosen because:

- **Read-only fanout**: The UI only consumes printer state; it does not send messages back on this channel.
- **Native browser support**: The `EventSource` API requires no library and handles reconnection automatically.
- **Simpler reconnect model**: EventSource reconnects with a `Last-Event-ID` header, allowing the server to replay missed state. WebSocket reconnect logic must be implemented entirely in application code.
- **HTTP/2 multiplexing**: SSE runs over HTTP and benefits from HTTP/2 stream multiplexing without extra effort.
- **WebSocket was rejected** for this leg because it adds bidirectional complexity to a channel that is read-only from the client's perspective, and it requires a separate upgrade handshake and session management that SSE already provides.

### Telemetry Retention Policy

All inbound connector events are classified as either **DURABLE** or **EPHEMERAL**.

**DURABLE** — written to the database:

| Event class | Examples | Rationale |
|---|---|---|
| Status transitions | `IDLE → PRINTING`, `PRINTING → PAUSED` | Audit log; used for utilization reporting and anomaly detection |
| Print lifecycle | Job start, job finish, job cancel, job error | Business record; referenced by orders and billing |
| File metadata | `fileName`, `platformJobId` at job start | Associates print record with source file |
| Connector audit | Agent connect, agent disconnect, lease change | Security audit; troubleshooting |

**EPHEMERAL** — delivered over SSE only, never written to the database:

| Field | Example values | Rationale |
|---|---|---|
| `progressPercent` | 0–100 | Stale within seconds; historically meaningless |
| `remainingSeconds` | Countdown | Same as above |
| `hotendTempC` | 220.4 | High-frequency sensor; historical values provide no operational value in v1 |
| `bedTempC` | 60.1 | Same |
| `currentSpeedMms` | Speed level enum | Operational only |
| `currentLayer` / `totalLayers` | Layer counts | Redundant with progress percent for planning |
| `fanSpeedPercent` | 0–100 | Operational only |

**Rationale for ephemeral classification:** Storing temperature/progress at 1–2 Hz for a farm of 20 printers generates ~1.7 M rows per day with negligible analytical value in v1. Status transitions — which occur O(10) times per print — are the only telemetry events with durable audit or planning significance.

**Live state snapshot:** The backend maintains a single `PrinterLiveState` record per printer updated in-place on every ingest event. This gives the UI a current snapshot without a DB write per frame. The snapshot row is the source of truth for the SSE initial-state event on client connect.

---

## Consequences

### Positive

- WebSocket ingest supports bidirectional control messages (lease management) with a single persistent connection.
- SSE fanout is simple to implement and leverages native browser reconnect semantics.
- Ephemeral telemetry classification eliminates the largest class of write amplification; DB growth scales with print volume, not telemetry frequency.
- Connector credentials remain on the customer's LAN; the backend never holds raw printer passwords.

### Negative

- WebSocket connections require server-side session state (active connector registry); horizontal scaling requires a shared session store or sticky routing.
- The live state snapshot row becomes a hot row for farms with many printers; row-level locking or optimistic updates may be needed at scale.
- SSE does not support binary framing; all telemetry payloads must be JSON, which is slightly less compact than binary protocols.
- Two different transport mechanisms (WebSocket inward, SSE outward) increase the surface area for infrastructure configuration (e.g., proxy timeout settings must be tuned for long-lived connections on both paths).
- The ephemeral classification means historical temperature trends are unavailable without a future time-series store integration.

### Implementation Constraints

In v1, `PrinterLiveState` updates MUST use an optimistic upsert strategy: `UPDATE ... WHERE updatedAt <= :incoming_timestamp`. This prevents an older out-of-order message from overwriting a newer state. A serialization queue is deferred to a future scale milestone.

---

## Open Decisions Resolved

- **File auto-discovery:** Out of scope for v1. User-triggered discovery in v2 is the working assumption; final decision deferred to that milestone.
- **Part default print file (per-printer/platform profile vs. global default):** Does not affect the connector schema. Deferred to the Projects/Parts milestone.

---

## Status

Accepted
