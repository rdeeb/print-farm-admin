/**
 * Event processor — persists durable events to the database and keeps
 * PrinterLiveState in sync.
 *
 * Ephemeral telemetry (temperatures, fan speed, layer counts) is NEVER
 * written here.  Only progressPercent and remainingSeconds may be updated
 * via updateLiveStateTelemetry(), and only as a selective upsert.
 */

import { PrinterEventType, PrinterStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { NormalizedStatusEvent, NormalizedLifecycleEvent, NormalizedErrorEvent } from './normalizers/bambu'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessEventOptions {
  tenantId: string
  printerId: string
  connectorSessionId?: string
  occurredAt: Date
}

// ---------------------------------------------------------------------------
// processDurableEvent
// ---------------------------------------------------------------------------

/**
 * Persist a PrinterEvent row and upsert PrinterLiveState for durable events.
 *
 * Live state update rules per event type:
 *  - STATUS_CHANGED:      update status; set lastError if ERROR, clear otherwise
 *  - PRINT_STARTED:       set platformJobId, fileName, status → PRINTING
 *  - PRINT_COMPLETED:     clear platformJobId, fileName; set status → IDLE
 *  - PRINT_CANCELLED:     clear platformJobId, fileName; set status → IDLE
 *  - PRINT_FAILED:        clear platformJobId, fileName; set status → ERROR
 *  - PRINT_PAUSED:        set status → PAUSED (keep job/file refs)
 *  - PRINT_RESUMED:       set status → PRINTING (keep job/file refs)
 *  - connector.error type (ERROR event): set lastError
 */
export async function processDurableEvent(
  normalized: NormalizedStatusEvent | NormalizedLifecycleEvent | NormalizedErrorEvent,
  opts: ProcessEventOptions
): Promise<void> {
  const { tenantId, printerId, connectorSessionId, occurredAt } = opts
  const { eventType, payload } = normalized

  const platformJobId = 'platformJobId' in normalized ? normalized.platformJobId : undefined
  const fileName = 'fileName' in normalized ? normalized.fileName : undefined

  // Determine printerStatus for the PrinterEvent row
  const printerStatus =
    'printerStatus' in normalized ? (normalized as NormalizedStatusEvent).printerStatus : undefined

  // 2. Upsert PrinterLiveState based on event type
  const liveStateUpdate = buildLiveStateUpdate(normalized)

  await prisma.$transaction(async (tx) => {
    // 1. Write the durable PrinterEvent row
    await tx.printerEvent.create({
      data: {
        tenantId,
        printerId,
        connectorSessionId: connectorSessionId ?? null,
        eventType,
        printerStatus: printerStatus ?? null,
        platformJobId: platformJobId ?? null,
        fileName: fileName ?? null,
        payload: payload as object,
        occurredAt,
      },
    })

    // Callers must have validated that printerId belongs to the authenticated tenantId before calling this function.
    await tx.printerLiveState.upsert({
      where: { printerId },
      create: {
        printerId,
        tenantId,
        ...liveStateUpdate,
      },
      update: liveStateUpdate,
    })
  })
}

// ---------------------------------------------------------------------------
// updateLiveStateTelemetry
// ---------------------------------------------------------------------------

/**
 * Selectively update progressPercent and remainingSeconds in PrinterLiveState.
 *
 * This is the ONLY telemetry data that may touch the live state table.
 * Temperatures, fan speed, and layer counts are SSE-only and must NEVER be
 * written to the database.
 *
 * Does NOT write a PrinterEvent row.
 */
export async function updateLiveStateTelemetry(
  tenantId: string,
  printerId: string,
  telemetry: { progressPercent?: number; remainingSeconds?: number }
): Promise<void> {
  const updateFields: Record<string, unknown> = {}

  if (telemetry.progressPercent !== undefined) {
    updateFields.progressPercent = telemetry.progressPercent
  }
  if (telemetry.remainingSeconds !== undefined) {
    updateFields.remainingSeconds = telemetry.remainingSeconds
  }

  // Nothing to update — skip the DB round-trip entirely
  if (Object.keys(updateFields).length === 0) return

  await prisma.printerLiveState.upsert({
    where: { printerId },
    create: {
      printerId,
      tenantId,
      ...updateFields,
    },
    update: updateFields,
  })
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the set of PrinterLiveState fields to write for a given normalized
 * event.  Returns a partial object suitable for use in both the `create` and
 * `update` sides of an upsert.
 */
function buildLiveStateUpdate(
  normalized: NormalizedStatusEvent | NormalizedLifecycleEvent | NormalizedErrorEvent
): Record<string, unknown> {
  const { eventType } = normalized

  switch (eventType) {
    case PrinterEventType.STATUS_CHANGED: {
      const statusEvent = normalized as NormalizedStatusEvent
      const update: Record<string, unknown> = {
        status: statusEvent.printerStatus,
      }

      if (statusEvent.printerStatus === PrinterStatus.ERROR) {
        // Preserve any errorMessage from the payload; fall back to a generic sentinel
        const errMsg =
          typeof statusEvent.payload.errorMessage === 'string'
            ? statusEvent.payload.errorMessage
            : 'Unknown error'
        update.lastError = errMsg
      } else {
        // Clear lastError for non-error statuses
        update.lastError = null
      }

      return update
    }

    case PrinterEventType.PRINT_STARTED: {
      const lifecycleEvent = normalized as NormalizedLifecycleEvent
      return {
        status: PrinterStatus.PRINTING,
        platformJobId: lifecycleEvent.platformJobId ?? null,
        fileName: lifecycleEvent.fileName ?? null,
        lastError: null,
      }
    }

    case PrinterEventType.PRINT_COMPLETED: {
      return {
        status: PrinterStatus.IDLE,
        platformJobId: null,
        fileName: null,
      }
    }

    case PrinterEventType.PRINT_CANCELLED: {
      return {
        status: PrinterStatus.IDLE,
        platformJobId: null,
        fileName: null,
      }
    }

    case PrinterEventType.PRINT_FAILED: {
      return {
        status: PrinterStatus.ERROR,
        platformJobId: null,
        fileName: null,
        lastError: (normalized.payload['errorMessage'] as string | undefined) ?? 'Print failed',
      }
    }

    case PrinterEventType.PRINT_PAUSED: {
      return {
        status: PrinterStatus.PAUSED,
      }
    }

    case PrinterEventType.PRINT_RESUMED: {
      return {
        status: PrinterStatus.PRINTING,
      }
    }

    case PrinterEventType.ERROR: {
      return {
        lastError: (normalized.payload['errorMessage'] as string | undefined) ?? 'Connector error',
      }
    }

    default: {
      // For event types not explicitly handled (PRINT_PROGRESS,
      // CONNECTOR_CONNECTED, CONNECTOR_DISCONNECTED) perform no live state
      // update fields — the updatedAt will still be refreshed by Prisma.
      return {}
    }
  }
}
