/**
 * WebSocket message contract — schemaVersion 1
 *
 * Canonical Zod schemas for all messages exchanged between connectors
 * (browser, Chrome extension, Go agent) and the backend ingest endpoint.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema version constant (Change 13)
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = 1 as const

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const PrinterStatusSchema = z.enum([
  'OFFLINE',
  'IDLE',
  'PRINTING',
  'PAUSED',
  'ERROR',
  'MAINTENANCE',
])
export type PrinterStatus = z.infer<typeof PrinterStatusSchema>

export const ConnectorRuntimeSchema = z.enum([
  'WEB_APP',
  'CHROME_EXTENSION',
  'GO_AGENT',
])
export type ConnectorRuntime = z.infer<typeof ConnectorRuntimeSchema>

export const ReporterRoleSchema = z.enum(['ACTIVE', 'STANDBY'])
export type ReporterRole = z.infer<typeof ReporterRoleSchema>

export const PrintLifecycleEventSchema = z.enum([
  'STARTED',
  'PAUSED',
  'RESUMED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
])
export type PrintLifecycleEvent = z.infer<typeof PrintLifecycleEventSchema>

// ---------------------------------------------------------------------------
// Shared sub-schemas (Change 9)
// ---------------------------------------------------------------------------

const ProgressPercentSchema = z.number().min(0).max(100)

// ---------------------------------------------------------------------------
// Envelope base (fields shared by every client→server message)
// ---------------------------------------------------------------------------

const EnvelopeBaseSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  type: z.string(),
  timestamp: z.string().datetime({ message: 'timestamp must be ISO 8601' }),
  tenantId: z.string().min(1),
  printerExternalId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Server envelope base (fields shared by every server→client message)
// Does NOT include printerExternalId — server messages are not printer-addressed
// (Change 5)
// ---------------------------------------------------------------------------

const ServerEnvelopeBaseSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  type: z.string(),
  timestamp: z.string().datetime({ message: 'timestamp must be ISO 8601' }),
  tenantId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Client → Server payload schemas
// ---------------------------------------------------------------------------

export const HeartbeatPayloadSchema = z.object({
  connectorRuntime: ConnectorRuntimeSchema,
  // Change 8: semver format validation
  connectorVersion: z.string().regex(/^\d+\.\d+\.\d+/, {
    message: 'connectorVersion must follow semver (e.g. 1.2.3 or 1.2.3-dev)',
  }),
  // Change 12: fingerprint max length
  fingerprint: z.string().min(1).max(256),
  reporterRole: ReporterRoleSchema,
  // Change 4: optional platformJobId on heartbeat
  platformJobId: z.string().optional(),
})
export type HeartbeatPayload = z.infer<typeof HeartbeatPayloadSchema>

// Change 3: ERROR status requires errorMessage
export const PrinterStatusPayloadSchema = z
  .object({
    status: PrinterStatusSchema,
    previousStatus: PrinterStatusSchema.optional(),
    platformJobId: z.string().optional(),
    fileName: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === 'ERROR' && !val.errorMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errorMessage is required when status is ERROR',
      })
    }
  })
export type PrinterStatusPayload = z.infer<typeof PrinterStatusPayloadSchema>

export const PrintLifecyclePayloadSchema = z.object({
  event: PrintLifecycleEventSchema,
  platformJobId: z.string().optional(),
  fileName: z.string().optional(),
  elapsedSeconds: z.number().nonnegative().optional(),
  estimatedSeconds: z.number().nonnegative().optional(),
  // Change 9: use shared ProgressPercentSchema
  progressPercent: ProgressPercentSchema.optional(),
})
export type PrintLifecyclePayload = z.infer<typeof PrintLifecyclePayloadSchema>

// Change 1: require at least one field; Change 2: temperature bounds; Change 9: shared ProgressPercentSchema
export const PrinterTelemetryPayloadSchema = z
  .object({
    // Change 2: physical sanity bounds for temperatures
    hotendTempC: z.number().min(-30).max(500).optional(),
    bedTempC: z.number().min(-30).max(200).optional(),
    // Change 9: use shared ProgressPercentSchema
    progressPercent: ProgressPercentSchema.optional(),
    fanSpeedPercent: z.number().min(0).max(100).optional(),
    currentLayer: z.number().int().nonnegative().optional(),
    totalLayers: z.number().int().nonnegative().optional(),
    currentSpeedMms: z.number().nonnegative().optional(),
  })
  // Change 1: at least one telemetry field must be present
  .refine((val) => Object.values(val).some((v) => v !== undefined), {
    message: 'At least one telemetry field must be present',
  })
export type PrinterTelemetryPayload = z.infer<typeof PrinterTelemetryPayloadSchema>

export const ConnectorErrorPayloadSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  recoverable: z.boolean(),
  context: z.unknown().optional(),
})
export type ConnectorErrorPayload = z.infer<typeof ConnectorErrorPayloadSchema>

// ---------------------------------------------------------------------------
// Client → Server message schemas (full envelope)
// ---------------------------------------------------------------------------

export const HeartbeatMessageSchema = EnvelopeBaseSchema.extend({
  type: z.literal('heartbeat'),
  payload: HeartbeatPayloadSchema,
})
export type HeartbeatMessage = z.infer<typeof HeartbeatMessageSchema>

export const PrinterStatusMessageSchema = EnvelopeBaseSchema.extend({
  type: z.literal('printer.status'),
  payload: PrinterStatusPayloadSchema,
})
export type PrinterStatusMessage = z.infer<typeof PrinterStatusMessageSchema>

export const PrintLifecycleMessageSchema = EnvelopeBaseSchema.extend({
  type: z.literal('print.lifecycle'),
  payload: PrintLifecyclePayloadSchema,
})
export type PrintLifecycleMessage = z.infer<typeof PrintLifecycleMessageSchema>

export const PrinterTelemetryMessageSchema = EnvelopeBaseSchema.extend({
  type: z.literal('printer.telemetry'),
  payload: PrinterTelemetryPayloadSchema,
})
export type PrinterTelemetryMessage = z.infer<typeof PrinterTelemetryMessageSchema>

export const ConnectorErrorMessageSchema = EnvelopeBaseSchema.extend({
  type: z.literal('connector.error'),
  payload: ConnectorErrorPayloadSchema,
})
export type ConnectorErrorMessage = z.infer<typeof ConnectorErrorMessageSchema>

// ---------------------------------------------------------------------------
// Client → Server discriminated union
// ---------------------------------------------------------------------------

export const ConnectorMessageSchema = z.discriminatedUnion('type', [
  HeartbeatMessageSchema,
  PrinterStatusMessageSchema,
  PrintLifecycleMessageSchema,
  PrinterTelemetryMessageSchema,
  ConnectorErrorMessageSchema,
])
export type ConnectorMessage = z.infer<typeof ConnectorMessageSchema>

// ---------------------------------------------------------------------------
// Server → Client payload schemas
// ---------------------------------------------------------------------------

// Change 14: removed printerExternalId from promote/demote payloads (DB UUID only)
export const ReporterPromotePayloadSchema = z.object({
  printerId: z.string().min(1),
})
export type ReporterPromotePayload = z.infer<typeof ReporterPromotePayloadSchema>

// Change 14: removed printerExternalId from promote/demote payloads (DB UUID only)
export const ReporterDemotePayloadSchema = z.object({
  printerId: z.string().min(1),
  reason: z.string().optional(),
})
export type ReporterDemotePayload = z.infer<typeof ReporterDemotePayloadSchema>

export const AssignmentSchema = z.object({
  printerId: z.string().min(1),
  printerExternalId: z.string().min(1),
  reporterRole: ReporterRoleSchema,
})
export type Assignment = z.infer<typeof AssignmentSchema>

// Change 7: assignments array must have at least one entry
export const AssignmentsUpdatePayloadSchema = z.object({
  assignments: z
    .array(AssignmentSchema)
    .min(1, { message: 'assignments.update must contain at least one assignment' }),
})
export type AssignmentsUpdatePayload = z.infer<typeof AssignmentsUpdatePayloadSchema>

// ---------------------------------------------------------------------------
// Server → Client message schemas (full envelope)
// Change 5: use ServerEnvelopeBaseSchema (no printerExternalId)
// ---------------------------------------------------------------------------

export const ReporterPromoteMessageSchema = ServerEnvelopeBaseSchema.extend({
  type: z.literal('reporter.promote'),
  payload: ReporterPromotePayloadSchema,
})
export type ReporterPromoteMessage = z.infer<typeof ReporterPromoteMessageSchema>

export const ReporterDemoteMessageSchema = ServerEnvelopeBaseSchema.extend({
  type: z.literal('reporter.demote'),
  payload: ReporterDemotePayloadSchema,
})
export type ReporterDemoteMessage = z.infer<typeof ReporterDemoteMessageSchema>

export const AssignmentsUpdateMessageSchema = ServerEnvelopeBaseSchema.extend({
  type: z.literal('assignments.update'),
  payload: AssignmentsUpdatePayloadSchema,
})
export type AssignmentsUpdateMessage = z.infer<typeof AssignmentsUpdateMessageSchema>

// ---------------------------------------------------------------------------
// Server → Client discriminated union
// ---------------------------------------------------------------------------

export const ServerControlMessageSchema = z.discriminatedUnion('type', [
  ReporterPromoteMessageSchema,
  ReporterDemoteMessageSchema,
  AssignmentsUpdateMessageSchema,
])
export type ServerControlMessage = z.infer<typeof ServerControlMessageSchema>

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

/**
 * Parse a raw unknown value as a client→server ConnectorMessage.
 * Returns the typed message on success, throws ZodError on failure.
 */
export function parseConnectorMessage(raw: unknown): ConnectorMessage {
  return ConnectorMessageSchema.parse(raw)
}

/**
 * Parse a raw unknown value as a server→client ServerControlMessage.
 * Returns the typed message on success, throws ZodError on failure.
 */
export function parseServerControlMessage(raw: unknown): ServerControlMessage {
  return ServerControlMessageSchema.parse(raw)
}

// Change 6: safe-parse helpers that return result objects instead of throwing
export function safeParseConnectorMessage(raw: unknown) {
  return ConnectorMessageSchema.safeParse(raw)
}

export function safeParseServerControlMessage(raw: unknown) {
  return ServerControlMessageSchema.safeParse(raw)
}
