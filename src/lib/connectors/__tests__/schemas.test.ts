import { ZodError } from 'zod'
import {
  parseConnectorMessage,
  parseServerControlMessage,
  safeParseConnectorMessage,
  safeParseServerControlMessage,
  HeartbeatMessageSchema,
  PrinterStatusMessageSchema,
  PrintLifecycleMessageSchema,
  PrinterTelemetryMessageSchema,
  ConnectorErrorMessageSchema,
  ReporterPromoteMessageSchema,
  ReporterDemoteMessageSchema,
  AssignmentsUpdateMessageSchema,
  ConnectorMessageSchema,
  ServerControlMessageSchema,
  HeartbeatAckMessageSchema,
  SCHEMA_VERSION,
} from '../schemas'

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

const BASE_ENVELOPE = {
  schemaVersion: SCHEMA_VERSION,
  timestamp: '2026-03-11T12:00:00.000Z',
  tenantId: 'tenant-abc',
  printerExternalId: 'ext-printer-001',
}

// Server messages do NOT include printerExternalId (Change 5)
const SERVER_ENVELOPE = {
  schemaVersion: SCHEMA_VERSION,
  timestamp: '2026-03-11T12:00:00.000Z',
  tenantId: 'tenant-abc',
}

// ---------------------------------------------------------------------------
// heartbeat
// ---------------------------------------------------------------------------

describe('HeartbeatMessageSchema', () => {
  const valid = {
    ...BASE_ENVELOPE,
    type: 'heartbeat',
    payload: {
      connectorRuntime: 'GO_AGENT',
      connectorVersion: '1.2.3',
      fingerprint: 'fp-xyz',
      reporterRole: 'ACTIVE',
    },
  }

  it('parses a valid heartbeat message', () => {
    const result = HeartbeatMessageSchema.parse(valid)
    expect(result.type).toBe('heartbeat')
    expect(result.payload.connectorRuntime).toBe('GO_AGENT')
    expect(result.payload.reporterRole).toBe('ACTIVE')
  })

  it('accepts all ConnectorRuntime values', () => {
    for (const runtime of ['WEB_APP', 'CHROME_EXTENSION', 'GO_AGENT'] as const) {
      expect(() =>
        HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, connectorRuntime: runtime } })
      ).not.toThrow()
    }
  })

  it('accepts STANDBY reporterRole', () => {
    const msg = { ...valid, payload: { ...valid.payload, reporterRole: 'STANDBY' } }
    const result = HeartbeatMessageSchema.parse(msg)
    expect(result.payload.reporterRole).toBe('STANDBY')
  })

  it('rejects unknown connectorRuntime', () => {
    const bad = { ...valid, payload: { ...valid.payload, connectorRuntime: 'BROWSER' } }
    expect(() => HeartbeatMessageSchema.parse(bad)).toThrow(ZodError)
  })

  it('rejects missing fingerprint', () => {
    const { fingerprint: _fp, ...payloadWithout } = valid.payload
    expect(() => HeartbeatMessageSchema.parse({ ...valid, payload: payloadWithout })).toThrow(ZodError)
  })

  it('rejects wrong schemaVersion', () => {
    expect(() => HeartbeatMessageSchema.parse({ ...valid, schemaVersion: 2 })).toThrow(ZodError)
  })

  it('rejects non-ISO timestamp', () => {
    expect(() => HeartbeatMessageSchema.parse({ ...valid, timestamp: 'not-a-date' })).toThrow(ZodError)
  })

  // Change 4: platformJobId is optional on heartbeat
  it('accepts optional platformJobId', () => {
    const withJobId = { ...valid, payload: { ...valid.payload, platformJobId: 'job-123' } }
    const result = HeartbeatMessageSchema.parse(withJobId)
    expect(result.payload.platformJobId).toBe('job-123')
  })

  it('parses heartbeat without platformJobId', () => {
    const result = HeartbeatMessageSchema.parse(valid)
    expect(result.payload.platformJobId).toBeUndefined()
  })

  // Change 8: connectorVersion semver format
  it('accepts valid semver connectorVersion', () => {
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, connectorVersion: '1.0.0' } })
    ).not.toThrow()
  })

  it('accepts semver with pre-release suffix', () => {
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, connectorVersion: '1.0.0-dev' } })
    ).not.toThrow()
  })

  it('rejects non-semver connectorVersion "dev-branch"', () => {
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, connectorVersion: 'dev-branch' } })
    ).toThrow(ZodError)
  })

  it('rejects incomplete semver "1.0"', () => {
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, connectorVersion: '1.0' } })
    ).toThrow(ZodError)
  })

  // Change 12: fingerprint max length
  it('rejects a fingerprint longer than 256 characters', () => {
    const longFingerprint = 'x'.repeat(257)
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, fingerprint: longFingerprint } })
    ).toThrow(ZodError)
  })

  it('accepts a fingerprint of exactly 256 characters', () => {
    const maxFingerprint = 'x'.repeat(256)
    expect(() =>
      HeartbeatMessageSchema.parse({ ...valid, payload: { ...valid.payload, fingerprint: maxFingerprint } })
    ).not.toThrow()
  })

  // connectorSessionId is optional in EnvelopeBaseSchema
  it('parses a heartbeat message with connectorSessionId', () => {
    const withSession = { ...valid, connectorSessionId: 'sess_abc123' }
    const result = HeartbeatMessageSchema.parse(withSession)
    expect(result.connectorSessionId).toBe('sess_abc123')
  })

  it('parses a heartbeat message without connectorSessionId (it is optional)', () => {
    const result = HeartbeatMessageSchema.parse(valid)
    expect(result.connectorSessionId).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// printer.status
// ---------------------------------------------------------------------------

describe('PrinterStatusMessageSchema', () => {
  const valid = {
    ...BASE_ENVELOPE,
    type: 'printer.status',
    payload: {
      status: 'PRINTING',
    },
  }

  it('parses a minimal printer.status message', () => {
    const result = PrinterStatusMessageSchema.parse(valid)
    expect(result.type).toBe('printer.status')
    expect(result.payload.status).toBe('PRINTING')
  })

  it('parses with all optional fields (non-ERROR status)', () => {
    const full = {
      ...valid,
      payload: {
        status: 'PAUSED',
        previousStatus: 'PRINTING',
        platformJobId: 'job-123',
        fileName: 'model.gcode',
      },
    }
    const result = PrinterStatusMessageSchema.parse(full)
    expect(result.payload.previousStatus).toBe('PRINTING')
  })

  it('parses ERROR status with errorMessage', () => {
    const errMsg = {
      ...valid,
      payload: {
        status: 'ERROR',
        previousStatus: 'PRINTING',
        platformJobId: 'job-123',
        fileName: 'model.gcode',
        errorMessage: 'Nozzle clog detected',
      },
    }
    const result = PrinterStatusMessageSchema.parse(errMsg)
    expect(result.payload.errorMessage).toBe('Nozzle clog detected')
  })

  it('accepts all non-ERROR PrinterStatus enum values without errorMessage', () => {
    for (const status of ['OFFLINE', 'IDLE', 'PRINTING', 'PAUSED', 'MAINTENANCE'] as const) {
      expect(() =>
        PrinterStatusMessageSchema.parse({ ...valid, payload: { status } })
      ).not.toThrow()
    }
  })

  // Change 3: ERROR without errorMessage must fail
  it('rejects ERROR status without errorMessage', () => {
    expect(() =>
      PrinterStatusMessageSchema.parse({ ...valid, payload: { status: 'ERROR' } })
    ).toThrow(ZodError)
  })

  it('rejects invalid status value', () => {
    expect(() =>
      PrinterStatusMessageSchema.parse({ ...valid, payload: { status: 'UNKNOWN' } })
    ).toThrow(ZodError)
  })

  it('rejects missing status field', () => {
    expect(() =>
      PrinterStatusMessageSchema.parse({ ...valid, payload: {} })
    ).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// print.lifecycle
// ---------------------------------------------------------------------------

describe('PrintLifecycleMessageSchema', () => {
  const valid = {
    ...BASE_ENVELOPE,
    type: 'print.lifecycle',
    payload: {
      event: 'STARTED',
    },
  }

  it('parses a minimal print.lifecycle message', () => {
    const result = PrintLifecycleMessageSchema.parse(valid)
    expect(result.type).toBe('print.lifecycle')
    expect(result.payload.event).toBe('STARTED')
  })

  it('parses with all optional fields', () => {
    const full = {
      ...valid,
      payload: {
        event: 'COMPLETED',
        platformJobId: 'job-456',
        fileName: 'part.gcode',
        elapsedSeconds: 3600,
        estimatedSeconds: 3500,
        progressPercent: 100,
      },
    }
    const result = PrintLifecycleMessageSchema.parse(full)
    expect(result.payload.progressPercent).toBe(100)
    expect(result.payload.elapsedSeconds).toBe(3600)
  })

  it('accepts all lifecycle event values', () => {
    for (const event of ['STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'FAILED', 'CANCELLED'] as const) {
      expect(() =>
        PrintLifecycleMessageSchema.parse({ ...valid, payload: { event } })
      ).not.toThrow()
    }
  })

  it('rejects invalid event value', () => {
    expect(() =>
      PrintLifecycleMessageSchema.parse({ ...valid, payload: { event: 'ABORTED' } })
    ).toThrow(ZodError)
  })

  it('rejects progressPercent > 100', () => {
    expect(() =>
      PrintLifecycleMessageSchema.parse({ ...valid, payload: { event: 'STARTED', progressPercent: 101 } })
    ).toThrow(ZodError)
  })

  it('rejects negative elapsedSeconds', () => {
    expect(() =>
      PrintLifecycleMessageSchema.parse({ ...valid, payload: { event: 'STARTED', elapsedSeconds: -1 } })
    ).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// printer.telemetry
// ---------------------------------------------------------------------------

describe('PrinterTelemetryMessageSchema', () => {
  const validWithField = {
    ...BASE_ENVELOPE,
    type: 'printer.telemetry',
    payload: { hotendTempC: 210.5 },
  }

  // Change 1: empty payload now fails (at least one field required)
  it('rejects an empty telemetry payload (at least one field required)', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: {} })
    ).toThrow(ZodError)
  })

  it('parses a minimal telemetry payload with one field', () => {
    const result = PrinterTelemetryMessageSchema.parse(validWithField)
    expect(result.type).toBe('printer.telemetry')
    expect(result.payload.hotendTempC).toBe(210.5)
  })

  it('parses a full telemetry payload', () => {
    const full = {
      ...BASE_ENVELOPE,
      type: 'printer.telemetry',
      payload: {
        hotendTempC: 210.5,
        bedTempC: 60.0,
        progressPercent: 45.2,
        fanSpeedPercent: 80,
        currentLayer: 150,
        totalLayers: 300,
        currentSpeedMms: 60,
      },
    }
    const result = PrinterTelemetryMessageSchema.parse(full)
    expect(result.payload.hotendTempC).toBe(210.5)
    expect(result.payload.currentLayer).toBe(150)
    expect(result.payload.totalLayers).toBe(300)
  })

  it('rejects progressPercent out of range', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { progressPercent: -5 } })
    ).toThrow(ZodError)
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { progressPercent: 105 } })
    ).toThrow(ZodError)
  })

  it('rejects negative currentSpeedMms', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { currentSpeedMms: -1 } })
    ).toThrow(ZodError)
  })

  it('rejects non-integer currentLayer', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { currentLayer: 1.5 } })
    ).toThrow(ZodError)
  })

  // Change 2: temperature bounds
  it('rejects hotendTempC above 500', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { hotendTempC: 501 } })
    ).toThrow(ZodError)
  })

  it('rejects hotendTempC below -30', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { hotendTempC: -31 } })
    ).toThrow(ZodError)
  })

  it('rejects bedTempC above 200', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { bedTempC: 201 } })
    ).toThrow(ZodError)
  })

  it('rejects bedTempC below -30', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { bedTempC: -31 } })
    ).toThrow(ZodError)
  })

  it('accepts hotendTempC at bounds (0 and 500)', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { hotendTempC: 0 } })
    ).not.toThrow()
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { hotendTempC: 500 } })
    ).not.toThrow()
  })

  it('accepts bedTempC at bounds (0 and 200)', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { bedTempC: 0 } })
    ).not.toThrow()
    expect(() =>
      PrinterTelemetryMessageSchema.parse({ ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { bedTempC: 200 } })
    ).not.toThrow()
  })

  it('parses a telemetry message with remainingSeconds: 120', () => {
    const result = PrinterTelemetryMessageSchema.parse({
      ...BASE_ENVELOPE,
      type: 'printer.telemetry',
      payload: { remainingSeconds: 120 },
    })
    expect(result.payload.remainingSeconds).toBe(120)
  })

  it('accepts remainingSeconds: 0 (zero is nonnegative)', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({
        ...BASE_ENVELOPE,
        type: 'printer.telemetry',
        payload: { remainingSeconds: 0 },
      })
    ).not.toThrow()
  })

  it('rejects negative remainingSeconds', () => {
    expect(() =>
      PrinterTelemetryMessageSchema.parse({
        ...BASE_ENVELOPE,
        type: 'printer.telemetry',
        payload: { remainingSeconds: -1 },
      })
    ).toThrow(ZodError)
  })

  it('parses a telemetry message with only remainingSeconds (single-field minimum)', () => {
    const result = PrinterTelemetryMessageSchema.parse({
      ...BASE_ENVELOPE,
      type: 'printer.telemetry',
      payload: { remainingSeconds: 300 },
    })
    expect(result.payload.remainingSeconds).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// connector.error
// ---------------------------------------------------------------------------

describe('ConnectorErrorMessageSchema', () => {
  const valid = {
    ...BASE_ENVELOPE,
    type: 'connector.error',
    payload: {
      code: 'CONNECTION_TIMEOUT',
      message: 'Could not reach printer',
      recoverable: true,
    },
  }

  it('parses a valid connector.error message', () => {
    const result = ConnectorErrorMessageSchema.parse(valid)
    expect(result.type).toBe('connector.error')
    expect(result.payload.recoverable).toBe(true)
  })

  it('parses with optional context field', () => {
    const withCtx = {
      ...valid,
      payload: { ...valid.payload, context: { attempt: 3, lastSeen: '2026-03-11T11:59:00Z' } },
    }
    const result = ConnectorErrorMessageSchema.parse(withCtx)
    expect(result.payload.context).toBeDefined()
  })

  it('accepts any shape for context (unknown)', () => {
    const withStringCtx = { ...valid, payload: { ...valid.payload, context: 'just a string' } }
    expect(() => ConnectorErrorMessageSchema.parse(withStringCtx)).not.toThrow()
  })

  it('rejects missing code field', () => {
    const { code: _c, ...payloadWithout } = valid.payload
    expect(() => ConnectorErrorMessageSchema.parse({ ...valid, payload: payloadWithout })).toThrow(ZodError)
  })

  it('rejects non-boolean recoverable', () => {
    expect(() =>
      ConnectorErrorMessageSchema.parse({ ...valid, payload: { ...valid.payload, recoverable: 'yes' } })
    ).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// ConnectorMessage discriminated union
// ---------------------------------------------------------------------------

describe('ConnectorMessageSchema (discriminated union)', () => {
  it('routes heartbeat type to HeartbeatMessage', () => {
    const msg = {
      ...BASE_ENVELOPE,
      type: 'heartbeat',
      payload: {
        connectorRuntime: 'WEB_APP',
        connectorVersion: '0.1.0',
        fingerprint: 'fp-001',
        reporterRole: 'STANDBY',
      },
    }
    const result = ConnectorMessageSchema.parse(msg)
    expect(result.type).toBe('heartbeat')
    if (result.type === 'heartbeat') {
      expect(result.payload.connectorRuntime).toBe('WEB_APP')
    }
  })

  it('routes printer.status type to PrinterStatusMessage', () => {
    const msg = { ...BASE_ENVELOPE, type: 'printer.status', payload: { status: 'IDLE' } }
    const result = ConnectorMessageSchema.parse(msg)
    expect(result.type).toBe('printer.status')
    if (result.type === 'printer.status') {
      expect(result.payload.status).toBe('IDLE')
    }
  })

  it('routes print.lifecycle type', () => {
    const msg = { ...BASE_ENVELOPE, type: 'print.lifecycle', payload: { event: 'FAILED' } }
    const result = ConnectorMessageSchema.parse(msg)
    expect(result.type).toBe('print.lifecycle')
  })

  it('routes printer.telemetry type', () => {
    const msg = { ...BASE_ENVELOPE, type: 'printer.telemetry', payload: { hotendTempC: 200 } }
    const result = ConnectorMessageSchema.parse(msg)
    expect(result.type).toBe('printer.telemetry')
  })

  it('routes connector.error type', () => {
    const msg = {
      ...BASE_ENVELOPE,
      type: 'connector.error',
      payload: { code: 'ERR', message: 'fail', recoverable: false },
    }
    const result = ConnectorMessageSchema.parse(msg)
    expect(result.type).toBe('connector.error')
  })

  it('rejects an unknown message type', () => {
    const msg = { ...BASE_ENVELOPE, type: 'unknown.type', payload: {} }
    expect(() => ConnectorMessageSchema.parse(msg)).toThrow(ZodError)
  })

  it('rejects a server control message type (reporter.promote)', () => {
    const msg = {
      ...BASE_ENVELOPE,
      type: 'reporter.promote',
      payload: { printerId: 'p1' },
    }
    expect(() => ConnectorMessageSchema.parse(msg)).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// Server control messages
// Change 5: server messages use SERVER_ENVELOPE (no printerExternalId)
// Change 14: promote/demote payloads no longer have printerExternalId
// ---------------------------------------------------------------------------

describe('ReporterPromoteMessageSchema', () => {
  const valid = {
    ...SERVER_ENVELOPE,
    type: 'reporter.promote',
    payload: {
      printerId: 'printer-uuid-1',
      leaseExpiresAt: '2026-03-11T12:00:45.000Z',
      heartbeatIntervalSeconds: 15,
    },
  }

  it('parses a valid reporter.promote message', () => {
    const result = ReporterPromoteMessageSchema.parse(valid)
    expect(result.type).toBe('reporter.promote')
    expect(result.payload.printerId).toBe('printer-uuid-1')
    expect(result.payload.leaseExpiresAt).toBe('2026-03-11T12:00:45.000Z')
    expect(result.payload.heartbeatIntervalSeconds).toBe(15)
  })

  it('rejects missing printerId', () => {
    const bad = { ...valid, payload: {} }
    expect(() => ReporterPromoteMessageSchema.parse(bad)).toThrow(ZodError)
  })

  it('does not require printerExternalId in envelope', () => {
    // SERVER_ENVELOPE has no printerExternalId — message should still parse
    expect(() => ReporterPromoteMessageSchema.parse(valid)).not.toThrow()
  })

  it('rejects promote message without leaseExpiresAt', () => {
    const { leaseExpiresAt: _l, ...payloadWithout } = valid.payload
    expect(() =>
      ReporterPromoteMessageSchema.parse({ ...valid, payload: payloadWithout })
    ).toThrow(ZodError)
  })

  it('rejects promote message without heartbeatIntervalSeconds', () => {
    const { heartbeatIntervalSeconds: _h, ...payloadWithout } = valid.payload
    expect(() =>
      ReporterPromoteMessageSchema.parse({ ...valid, payload: payloadWithout })
    ).toThrow(ZodError)
  })
})

describe('ReporterDemoteMessageSchema', () => {
  const valid = {
    ...SERVER_ENVELOPE,
    type: 'reporter.demote',
    payload: { printerId: 'printer-uuid-1' },
  }

  it('parses without optional reason', () => {
    const result = ReporterDemoteMessageSchema.parse(valid)
    expect(result.type).toBe('reporter.demote')
    expect(result.payload.reason).toBeUndefined()
  })

  it('parses with optional reason', () => {
    const withReason = { ...valid, payload: { ...valid.payload, reason: 'New active reporter elected' } }
    const result = ReporterDemoteMessageSchema.parse(withReason)
    expect(result.payload.reason).toBe('New active reporter elected')
  })
})

describe('AssignmentsUpdateMessageSchema', () => {
  const valid = {
    ...SERVER_ENVELOPE,
    type: 'assignments.update',
    payload: {
      assignments: [
        { printerId: 'p1', printerExternalId: 'ext-001', reporterRole: 'ACTIVE' },
        { printerId: 'p2', printerExternalId: 'ext-002', reporterRole: 'STANDBY' },
      ],
    },
  }

  it('parses a valid assignments.update message', () => {
    const result = AssignmentsUpdateMessageSchema.parse(valid)
    expect(result.type).toBe('assignments.update')
    expect(result.payload.assignments).toHaveLength(2)
    expect(result.payload.assignments[0].reporterRole).toBe('ACTIVE')
  })

  // Change 7: empty assignments array is now rejected
  it('rejects an empty assignments array', () => {
    const empty = { ...valid, payload: { assignments: [] } }
    expect(() => AssignmentsUpdateMessageSchema.parse(empty)).toThrow(ZodError)
  })

  // Change 7: single-assignment array passes
  it('parses a single-assignment array', () => {
    const single = {
      ...valid,
      payload: {
        assignments: [{ printerId: 'p1', printerExternalId: 'ext-001', reporterRole: 'ACTIVE' }],
      },
    }
    const result = AssignmentsUpdateMessageSchema.parse(single)
    expect(result.payload.assignments).toHaveLength(1)
  })

  it('rejects invalid reporterRole in assignment', () => {
    const bad = {
      ...valid,
      payload: {
        assignments: [{ printerId: 'p1', printerExternalId: 'ext-001', reporterRole: 'PRIMARY' }],
      },
    }
    expect(() => AssignmentsUpdateMessageSchema.parse(bad)).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// heartbeat.ack
// ---------------------------------------------------------------------------

describe('HeartbeatAckMessageSchema', () => {
  const valid = {
    ...SERVER_ENVELOPE,
    type: 'heartbeat.ack',
    payload: {
      leaseExpiresAt: '2026-03-11T12:00:45.000Z',
      heartbeatIntervalSeconds: 15,
    },
  }

  it('parses a valid heartbeat.ack with required fields', () => {
    const result = HeartbeatAckMessageSchema.parse(valid)
    expect(result.type).toBe('heartbeat.ack')
    expect(result.payload.leaseExpiresAt).toBe('2026-03-11T12:00:45.000Z')
    expect(result.payload.heartbeatIntervalSeconds).toBe(15)
  })

  it('accepts optional reporterRole field', () => {
    const withRole = { ...valid, payload: { ...valid.payload, reporterRole: 'ACTIVE' } }
    const result = HeartbeatAckMessageSchema.parse(withRole)
    expect(result.payload.reporterRole).toBe('ACTIVE')
  })

  it('parses without optional reporterRole', () => {
    const result = HeartbeatAckMessageSchema.parse(valid)
    expect(result.payload.reporterRole).toBeUndefined()
  })

  it('rejects missing leaseExpiresAt', () => {
    const { leaseExpiresAt: _l, ...payloadWithout } = valid.payload
    expect(() =>
      HeartbeatAckMessageSchema.parse({ ...valid, payload: payloadWithout })
    ).toThrow(ZodError)
  })

  it('rejects missing heartbeatIntervalSeconds', () => {
    const { heartbeatIntervalSeconds: _h, ...payloadWithout } = valid.payload
    expect(() =>
      HeartbeatAckMessageSchema.parse({ ...valid, payload: payloadWithout })
    ).toThrow(ZodError)
  })

  it('rejects non-positive heartbeatIntervalSeconds', () => {
    expect(() =>
      HeartbeatAckMessageSchema.parse({ ...valid, payload: { ...valid.payload, heartbeatIntervalSeconds: 0 } })
    ).toThrow(ZodError)
    expect(() =>
      HeartbeatAckMessageSchema.parse({ ...valid, payload: { ...valid.payload, heartbeatIntervalSeconds: -5 } })
    ).toThrow(ZodError)
  })
})

describe('ServerControlMessageSchema (discriminated union)', () => {
  it('routes reporter.promote', () => {
    const msg = {
      ...SERVER_ENVELOPE,
      type: 'reporter.promote',
      payload: { printerId: 'p1', leaseExpiresAt: '2026-03-11T12:00:45.000Z', heartbeatIntervalSeconds: 15 },
    }
    const result = ServerControlMessageSchema.parse(msg)
    expect(result.type).toBe('reporter.promote')
  })

  it('routes reporter.demote', () => {
    const msg = {
      ...SERVER_ENVELOPE,
      type: 'reporter.demote',
      payload: { printerId: 'p1' },
    }
    const result = ServerControlMessageSchema.parse(msg)
    expect(result.type).toBe('reporter.demote')
  })

  it('routes assignments.update', () => {
    const msg = {
      ...SERVER_ENVELOPE,
      type: 'assignments.update',
      payload: {
        assignments: [{ printerId: 'p1', printerExternalId: 'ext-001', reporterRole: 'ACTIVE' }],
      },
    }
    const result = ServerControlMessageSchema.parse(msg)
    expect(result.type).toBe('assignments.update')
  })

  it('routes heartbeat.ack', () => {
    const msg = {
      ...SERVER_ENVELOPE,
      type: 'heartbeat.ack',
      payload: { leaseExpiresAt: '2026-03-11T12:00:45.000Z', heartbeatIntervalSeconds: 15 },
    }
    const result = ServerControlMessageSchema.parse(msg)
    expect(result.type).toBe('heartbeat.ack')
  })

  it('rejects a client message type (heartbeat)', () => {
    const msg = {
      ...SERVER_ENVELOPE,
      type: 'heartbeat',
      payload: {
        connectorRuntime: 'GO_AGENT',
        connectorVersion: '1.0.0',
        fingerprint: 'fp',
        reporterRole: 'ACTIVE',
      },
    }
    expect(() => ServerControlMessageSchema.parse(msg)).toThrow(ZodError)
  })

  it('rejects an unknown type', () => {
    const msg = { ...SERVER_ENVELOPE, type: 'server.ping', payload: {} }
    expect(() => ServerControlMessageSchema.parse(msg)).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// parseConnectorMessage helper
// ---------------------------------------------------------------------------

describe('parseConnectorMessage', () => {
  it('returns typed message for valid input', () => {
    const raw = {
      ...BASE_ENVELOPE,
      type: 'printer.status',
      payload: { status: 'IDLE' },
    }
    const result = parseConnectorMessage(raw)
    expect(result.type).toBe('printer.status')
    expect(result.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('throws ZodError for null input', () => {
    expect(() => parseConnectorMessage(null)).toThrow(ZodError)
  })

  it('throws ZodError for a plain string', () => {
    expect(() => parseConnectorMessage('{"type":"heartbeat"}')).toThrow(ZodError)
  })

  it('throws ZodError when schemaVersion is missing', () => {
    const raw = { type: 'heartbeat', timestamp: BASE_ENVELOPE.timestamp, tenantId: 't1', printerExternalId: 'e1', payload: { connectorRuntime: 'GO_AGENT', connectorVersion: '1.0.0', fingerprint: 'fp', reporterRole: 'ACTIVE' } }
    expect(() => parseConnectorMessage(raw)).toThrow(ZodError)
  })

  it('throws ZodError for wrong schemaVersion', () => {
    const raw = { ...BASE_ENVELOPE, schemaVersion: 2, type: 'printer.status', payload: { status: 'IDLE' } }
    expect(() => parseConnectorMessage(raw)).toThrow(ZodError)
  })

  it('throws ZodError when tenantId is empty string', () => {
    const raw = { ...BASE_ENVELOPE, tenantId: '', type: 'printer.status', payload: { status: 'IDLE' } }
    expect(() => parseConnectorMessage(raw)).toThrow(ZodError)
  })

  // Change 10: empty printerExternalId is rejected
  it('throws ZodError when printerExternalId is empty string', () => {
    const raw = { ...BASE_ENVELOPE, printerExternalId: '', type: 'printer.status', payload: { status: 'IDLE' } }
    expect(() => parseConnectorMessage(raw)).toThrow(ZodError)
  })

  it('throws ZodError for all message types with invalid payload', () => {
    const types = [
      { type: 'heartbeat', payload: {} },
      { type: 'printer.status', payload: {} },
      { type: 'print.lifecycle', payload: {} },
      // telemetry with empty payload now also fails (Change 1)
      { type: 'printer.telemetry', payload: {} },
      { type: 'connector.error', payload: {} },
    ]
    for (const { type, payload } of types) {
      expect(() => parseConnectorMessage({ ...BASE_ENVELOPE, type, payload })).toThrow(ZodError)
    }
  })

  // Change 11: document strip behavior
  it('strips unknown fields from connector messages (strip behavior is intentional for forward compat)', () => {
    const validHeartbeat = {
      ...BASE_ENVELOPE,
      type: 'heartbeat',
      payload: {
        connectorRuntime: 'GO_AGENT',
        connectorVersion: '1.0.0',
        fingerprint: 'fp-xyz',
        reporterRole: 'ACTIVE',
      },
    }
    const result = parseConnectorMessage({ ...validHeartbeat, unknownFutureField: 'ignored' })
    expect(result).not.toHaveProperty('unknownFutureField')
    // result is still valid — extra fields are stripped, not rejected
  })
})

// ---------------------------------------------------------------------------
// parseServerControlMessage helper
// ---------------------------------------------------------------------------

describe('parseServerControlMessage', () => {
  it('returns typed message for valid reporter.promote input', () => {
    const raw = {
      ...SERVER_ENVELOPE,
      type: 'reporter.promote',
      payload: { printerId: 'p1', leaseExpiresAt: '2026-03-11T12:00:45.000Z', heartbeatIntervalSeconds: 15 },
    }
    const result = parseServerControlMessage(raw)
    expect(result.type).toBe('reporter.promote')
    expect(result.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('throws ZodError for null input', () => {
    expect(() => parseServerControlMessage(null)).toThrow(ZodError)
  })

  it('throws ZodError for unknown type', () => {
    const raw = { ...SERVER_ENVELOPE, type: 'server.ping', payload: {} }
    expect(() => parseServerControlMessage(raw)).toThrow(ZodError)
  })

  it('throws ZodError when payload fields are missing', () => {
    const raw = { ...SERVER_ENVELOPE, type: 'reporter.promote', payload: {} }
    expect(() => parseServerControlMessage(raw)).toThrow(ZodError)
  })

  it('returns typed message for valid assignments.update with multiple entries', () => {
    const raw = {
      ...SERVER_ENVELOPE,
      type: 'assignments.update',
      payload: {
        assignments: [
          { printerId: 'p1', printerExternalId: 'ext-001', reporterRole: 'ACTIVE' },
          { printerId: 'p2', printerExternalId: 'ext-002', reporterRole: 'STANDBY' },
        ],
      },
    }
    const result = parseServerControlMessage(raw)
    if (result.type === 'assignments.update') {
      expect(result.payload.assignments).toHaveLength(2)
    }
  })
})

// ---------------------------------------------------------------------------
// Change 6: safe-parse helpers
// ---------------------------------------------------------------------------

describe('safeParseConnectorMessage', () => {
  it('returns success:true for a valid connector message', () => {
    const raw = {
      ...BASE_ENVELOPE,
      type: 'printer.status',
      payload: { status: 'IDLE' },
    }
    const result = safeParseConnectorMessage(raw)
    expect(result.success).toBe(true)
  })

  it('returns success:false for invalid input (does not throw)', () => {
    const result = safeParseConnectorMessage(null)
    expect(result.success).toBe(false)
  })

  it('returns success:false for unknown message type (does not throw)', () => {
    const result = safeParseConnectorMessage({ ...BASE_ENVELOPE, type: 'unknown', payload: {} })
    expect(result.success).toBe(false)
  })
})

describe('safeParseServerControlMessage', () => {
  it('returns success:true for a valid server control message', () => {
    const raw = {
      ...SERVER_ENVELOPE,
      type: 'reporter.promote',
      payload: { printerId: 'p1', leaseExpiresAt: '2026-03-11T12:00:45.000Z', heartbeatIntervalSeconds: 15 },
    }
    const result = safeParseServerControlMessage(raw)
    expect(result.success).toBe(true)
  })

  it('returns success:false for invalid input (does not throw)', () => {
    const result = safeParseServerControlMessage(null)
    expect(result.success).toBe(false)
  })

  it('returns success:false for unknown message type (does not throw)', () => {
    const result = safeParseServerControlMessage({ ...SERVER_ENVELOPE, type: 'client.msg', payload: {} })
    expect(result.success).toBe(false)
  })
})
