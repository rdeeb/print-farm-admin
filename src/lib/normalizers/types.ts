/**
 * Canonical inbound message types for the event normalization pipeline.
 *
 * These types re-use the existing connector message schemas from
 * src/lib/connectors/schemas.ts and extend them where the normalizers
 * require additional discriminant fields (e.g. accessMode for Bambu).
 *
 * schemaVersion = 1
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Re-export the core connector message types so normalizers import from one
// place rather than reaching into the connectors sub-directory directly.
// ---------------------------------------------------------------------------

export {
  // Schemas
  ConnectorMessageSchema,
  HeartbeatMessageSchema,
  PrinterStatusMessageSchema,
  PrintLifecycleMessageSchema,
  PrinterTelemetryMessageSchema,
  ConnectorErrorMessageSchema,
  // Types
  type ConnectorMessage,
  type HeartbeatMessage,
  type PrinterStatusMessage,
  type PrintLifecycleMessage,
  type PrinterTelemetryMessage,
  type ConnectorErrorMessage,
} from '@/lib/connectors/schemas'

// ---------------------------------------------------------------------------
// AccessMode — Bambu-specific field present on status, lifecycle, and telemetry
// messages.  The connector schemas do not mandate this field in the envelope;
// the normalizers consume it when the platform adapter includes it.
// ---------------------------------------------------------------------------

export const AccessModeSchema = z.enum(['LOCAL_FULL', 'READ_ONLY_FALLBACK'])
export type AccessMode = z.infer<typeof AccessModeSchema>

// ---------------------------------------------------------------------------
// Extended payload types used by the Bambu normalizer.
// The base message types come from connectors/schemas; these wrap them with
// the accessMode discriminant that the Bambu adapter always provides.
// ---------------------------------------------------------------------------

import {
  type PrinterStatusMessage,
  type PrintLifecycleMessage,
  type PrinterTelemetryMessage,
} from '@/lib/connectors/schemas'

/** A printer.status message that carries the Bambu accessMode field. */
export type BambuPrinterStatusMessage = PrinterStatusMessage & {
  payload: PrinterStatusMessage['payload'] & { accessMode: AccessMode }
}

/** A print.lifecycle message that carries the Bambu accessMode field. */
export type BambuPrintLifecycleMessage = PrintLifecycleMessage & {
  payload: PrintLifecycleMessage['payload'] & { accessMode: AccessMode }
}

/** A printer.telemetry message that carries the Bambu accessMode field. */
export type BambuPrinterTelemetryMessage = PrinterTelemetryMessage & {
  payload: PrinterTelemetryMessage['payload'] & { accessMode: AccessMode }
}
