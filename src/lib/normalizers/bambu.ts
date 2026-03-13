/**
 * Bambu-to-canonical normalizers.
 *
 * These are pure functions with no side effects and no database calls.
 * They translate Bambu platform messages into canonical normalized event
 * objects that the event-processor can persist.
 *
 * Note on lifecycle event values: the connector schema (PrintLifecycleEventSchema)
 * uses uppercase values: STARTED, PAUSED, RESUMED, COMPLETED, FAILED, CANCELLED.
 */

import { PrinterEventType, PrinterStatus } from '@prisma/client'
import type { BambuPrinterStatusMessage, BambuPrintLifecycleMessage, ConnectorErrorMessage } from './types'

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface NormalizedStatusEvent {
  eventType: PrinterEventType
  printerStatus: PrinterStatus
  platformJobId?: string
  fileName?: string
  /** Full normalized payload for JSON storage in PrinterEvent.payload */
  payload: Record<string, unknown>
}

export interface NormalizedLifecycleEvent {
  eventType: PrinterEventType
  platformJobId?: string
  fileName?: string
  /** Full normalized payload for JSON storage in PrinterEvent.payload */
  payload: Record<string, unknown>
}

export interface NormalizedErrorEvent {
  eventType: PrinterEventType  // always PrinterEventType.ERROR
  payload: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Status normalizer
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, PrinterStatus | undefined> = {
  IDLE: PrinterStatus.IDLE,
  PRINTING: PrinterStatus.PRINTING,
  PAUSED: PrinterStatus.PAUSED,
  ERROR: PrinterStatus.ERROR,
  MAINTENANCE: PrinterStatus.MAINTENANCE,
  OFFLINE: PrinterStatus.OFFLINE,
}

/**
 * Maps a Bambu `printer.status` message to a NormalizedStatusEvent.
 *
 * The `status` field in the message payload directly matches the PrinterStatus
 * enum values (IDLE, PRINTING, PAUSED, ERROR, MAINTENANCE, OFFLINE).
 */
export function normalizeBambuStatus(msg: BambuPrinterStatusMessage): NormalizedStatusEvent {
  const { status, platformJobId, fileName, errorMessage, accessMode } = msg.payload

  const printerStatus = STATUS_MAP[status]
  if (!printerStatus) {
    throw new Error(`normalizeBambuStatus: unknown status value "${status}"`)
  }

  const payloadFields: Record<string, unknown> = {
    status,
    accessMode,
  }

  if (platformJobId !== undefined) payloadFields.platformJobId = platformJobId
  if (fileName !== undefined) payloadFields.fileName = fileName
  if (errorMessage !== undefined) payloadFields.errorMessage = errorMessage

  if (accessMode === 'READ_ONLY_FALLBACK') {
    payloadFields.degradedMode = true
  }

  const normalized: NormalizedStatusEvent = {
    eventType: PrinterEventType.STATUS_CHANGED,
    printerStatus,
    payload: payloadFields,
  }

  if (platformJobId !== undefined) normalized.platformJobId = platformJobId
  if (fileName !== undefined) normalized.fileName = fileName

  return normalized
}

// ---------------------------------------------------------------------------
// Lifecycle event → PrinterEventType mapping
// ---------------------------------------------------------------------------

const LIFECYCLE_EVENT_MAP: Record<string, PrinterEventType> = {
  STARTED: PrinterEventType.PRINT_STARTED,
  PAUSED: PrinterEventType.PRINT_PAUSED,
  RESUMED: PrinterEventType.PRINT_RESUMED,
  COMPLETED: PrinterEventType.PRINT_COMPLETED,
  FAILED: PrinterEventType.PRINT_FAILED,
  CANCELLED: PrinterEventType.PRINT_CANCELLED,
}

// ---------------------------------------------------------------------------
// Lifecycle normalizer
// ---------------------------------------------------------------------------

/**
 * Maps a Bambu `print.lifecycle` message to a NormalizedLifecycleEvent.
 *
 * The `event` field in the connector schema uses uppercase values
 * (STARTED, PAUSED, RESUMED, COMPLETED, FAILED, CANCELLED).
 *
 * For READ_ONLY_FALLBACK mode the payload is marked with `degradedMode: true`.
 */
export function normalizeBambuLifecycle(
  msg: BambuPrintLifecycleMessage
): NormalizedLifecycleEvent {
  const { event, platformJobId, fileName, elapsedSeconds, estimatedSeconds, accessMode } =
    msg.payload

  const eventType = LIFECYCLE_EVENT_MAP[event]

  if (!eventType) {
    throw new Error(`normalizeBambuLifecycle: unknown lifecycle event "${event}"`)
  }

  const payloadFields: Record<string, unknown> = {
    event,
    accessMode,
  }

  if (platformJobId !== undefined) payloadFields.platformJobId = platformJobId
  if (fileName !== undefined) payloadFields.fileName = fileName
  if (elapsedSeconds !== undefined) payloadFields.elapsedSeconds = elapsedSeconds
  if (estimatedSeconds !== undefined) payloadFields.estimatedSeconds = estimatedSeconds

  if (accessMode === 'READ_ONLY_FALLBACK') {
    payloadFields.degradedMode = true
  }

  const normalized: NormalizedLifecycleEvent = {
    eventType,
    payload: payloadFields,
  }

  if (platformJobId !== undefined) normalized.platformJobId = platformJobId
  if (fileName !== undefined) normalized.fileName = fileName

  return normalized
}

// ---------------------------------------------------------------------------
// Connector error normalizer
// ---------------------------------------------------------------------------

/**
 * Maps a Bambu `connector.error` message to a NormalizedErrorEvent.
 */
export function normalizeBambuConnectorError(
  msg: ConnectorErrorMessage
): NormalizedErrorEvent {
  return {
    eventType: PrinterEventType.ERROR,
    payload: {
      errorCode: msg.payload.code,
      errorMessage: msg.payload.message,
    },
  }
}
