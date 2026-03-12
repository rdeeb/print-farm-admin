# Bambu Lab Field Mapping

**Date:** 2026-03-11
**Status:** Draft

Maps Bambu Lab MQTT `print` topic fields to the canonical connector schema used by the ingest endpoint. Two access modes are documented: full local mode and the read-only fallback.

---

## Section 1: Bambu Lab Local Mode (`LOCAL_FULL`)

Local mode must be enabled in the Bambu printer settings. The connector subscribes to `device/{serial}/report` on the printer's local MQTT broker (port 8883, TLS).

### Status Mapping: `gcode_state` → `PrinterStatus`

| Bambu `gcode_state` value | Canonical `PrinterStatus` | Notes |
|---|---|---|
| `RUNNING` | `PRINTING` | Active print in progress |
| `PAUSE` | `PAUSED` | Print paused by user or error recovery |
| `IDLE` | `IDLE` | No active print |
| `FINISH` | `IDLE` | Print completed; transitions to IDLE after job record is written |
| `FAILED` | `ERROR` | Print failed; connector emits a durable error event |
| `OFFLINE` | `OFFLINE` | Printer not reachable on MQTT |

| `MAINTENANCE` | `MAINTENANCE` | Set only via management UI action; never derived from `gcode_state`. Connector implementations must not emit this status. |

Status transitions from `gcode_state` are **DURABLE** — a `PrinterStatusEvent` row is written on every distinct status change.

### Field Mapping Table

| Bambu MQTT field | Canonical field | Type | Retention | Notes |
|---|---|---|---|---|
| `gcode_state` | `status` (→ `PrinterStatus`) | enum | **DURABLE** | See status table above. Written on transition only, not every message. |
| `subtask_name` | `fileName` | string | **DURABLE** | Recorded at job start in `PrintJob.fileName`. |
| `job_id` / `task_id` | `platformJobId` | string | **DURABLE** | `job_id` preferred; fall back to `task_id` if absent. Recorded at job start. |
| `mc_percent` | `progressPercent` | number (0–100) | **EPHEMERAL** | SSE only. Integer percent. |
| `mc_remaining_time` | `remainingSeconds` | number | **EPHEMERAL** | SSE only. Bambu reports in minutes; multiply by 60 to get seconds. |
| `nozzle_temper` | `hotendTempC` | number | **EPHEMERAL** | SSE only. Degrees Celsius, one decimal. |
| `bed_temper` | `bedTempC` | number | **EPHEMERAL** | SSE only. Degrees Celsius, one decimal. |
| `spd_lvl` | `currentSpeedMms` | number | **EPHEMERAL** | SSE only. **Note:** `spd_lvl` is a speed-level enum (1 = Silent, 2 = Standard, 3 = Sport, 4 = Ludicrous), not a raw mm/s value. The canonical field name is approximate; treat as ordinal speed level. Do not multiply to mm/s without firmware-specific calibration data. |
| `layer_num` | `currentLayer` | number | **EPHEMERAL** | SSE only. 0-indexed on some firmware; normalize to 1-indexed at connector. |
| `total_layer_num` | `totalLayers` | number | **EPHEMERAL** | SSE only. |
| `cooling_fan_speed` | `fanSpeedPercent` | number (0–100) | **EPHEMERAL** | SSE only. Raw value is 0–255 (uint8); convert with `round(val / 255 * 100)`. Note: Some early A1 firmware versions use a 0–15 range; verify against firmware under test. |

### Durable Fields Summary

These fields trigger a DB write when their value changes from the previous ingested message:

- `gcode_state` (status transitions)
- `subtask_name` (fileName, at job start/end)
- `job_id` / `task_id` (platformJobId, at job start)

All other fields in the table above are ephemeral: they update `PrinterLiveState` in-place and are fanned out over SSE but are never written to a history table.

---

## Section 2: Bambu Read-Only Fallback (`READ_ONLY_FALLBACK`)

For users who cannot or choose not to enable local mode on their Bambu printers. This mode uses the Bambu cloud MQTT channel, which provides a reduced field set and does not support control commands from the connector.

When a `PrinterConnection` record is created for this mode, `accessMode` must be set to `READ_ONLY_FALLBACK`.

### Available vs Unavailable Fields

| Canonical field | Availability | Notes |
|---|---|---|
| `status` (from `gcode_state`) | `AVAILABLE_REDUCED` | Basic status available (PRINTING, IDLE, OFFLINE). PAUSED state may not be reliably reported on all firmware versions. |
| `fileName` (`subtask_name`) | `AVAILABLE_REDUCED` | Present for cloud-initiated prints; absent for SD card or LAN-initiated prints. |
| `platformJobId` (`job_id`) | `AVAILABLE_REDUCED` | Cloud job ID available for Bambu Studio-initiated prints only. |
| `progressPercent` (`mc_percent`) | `AVAILABLE_REDUCED` | Available in cloud channel on most firmware. |
| `remainingSeconds` (`mc_remaining_time`) | `AVAILABLE_REDUCED` | Available on most firmware; accuracy same as local mode. |
| `hotendTempC` (`nozzle_temper`) | `UNAVAILABLE` | Not reliably published via cloud MQTT on current firmware. |
| `bedTempC` (`bed_temper`) | `UNAVAILABLE` | Not reliably published via cloud MQTT on current firmware. |
| `currentSpeedMms` (`spd_lvl`) | `UNAVAILABLE` | Not available in cloud channel. |
| `currentLayer` (`layer_num`) | `UNAVAILABLE` | Not available in cloud channel. |
| `totalLayers` (`total_layer_num`) | `UNAVAILABLE` | Not available in cloud channel. |
| `fanSpeedPercent` (`cooling_fan_speed`) | `UNAVAILABLE` | Not available in cloud channel. |

### Explicitly Unsupported Capabilities in READ_ONLY_FALLBACK

- **Control commands**: Pause, resume, cancel, and filament change commands cannot be sent. Connector must not expose these actions in STANDBY/fallback mode.
- **Job file list**: The connector cannot enumerate files on the printer's SD card or internal storage.
- **Job ID resolution**: Cloud job IDs cannot be correlated with local print files.
- **Direct nozzle/bed temp polling**: Some firmware versions do not publish thermal data in the cloud channel at all; absence of this field must not be treated as a sensor error.

### Connector Behavior for READ_ONLY_FALLBACK

- The connector should mark its session with `accessMode = READ_ONLY_FALLBACK` in the `ConnectorAgent` registration payload.
- The UI should surface a visible indicator when a printer's active connector is operating in fallback mode.
- Durable events for status transitions and job start/end should still be written when sufficient fields are present; fields marked `UNAVAILABLE` must be omitted from the event payload (not sent as null).

### Open Decisions Resolved

1. A `gcode_state` field alone is sufficient to emit a durable `STATUS_CHANGED` event in READ_ONLY_FALLBACK mode. Print lifecycle events (`PRINT_STARTED`, `PRINT_COMPLETED`, etc.) require both `gcode_state` and at least one of `subtask_name` or `job_id`.
2. A connector operating in READ_ONLY_FALLBACK mode may hold the active reporter lease. The lease system does not discriminate by `accessMode`.

---

## File Auto-Discovery

v1 decision: File enumeration (SD card job list) is **out of scope for v1**. Connectors must not implement or expose this capability. This is tracked as a v2 feature; whether discovery will be automatic or user-triggered will be decided at that milestone.
