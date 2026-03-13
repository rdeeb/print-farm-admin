/** @jest-environment node */

import { classifyMessage, type MessageClass } from './classifier'
import type { ConnectorMessage } from './types'

// ---------------------------------------------------------------------------
// Helpers — build minimal valid ConnectorMessage fixtures
// ---------------------------------------------------------------------------

const ENVELOPE = {
  schemaVersion: 1 as const,
  timestamp: '2026-03-13T10:00:00.000Z',
  tenantId: 'tenant-1',
  printerExternalId: 'printer-1',
}

function makeHeartbeat(): ConnectorMessage {
  return {
    ...ENVELOPE,
    type: 'heartbeat',
    payload: {
      connectorRuntime: 'WEB_APP',
      connectorVersion: '1.0.0',
      fingerprint: 'fp-abc',
      reporterRole: 'ACTIVE',
    },
  }
}

function makePrinterStatus(): ConnectorMessage {
  return {
    ...ENVELOPE,
    type: 'printer.status',
    payload: {
      status: 'IDLE',
    },
  }
}

function makePrintLifecycle(): ConnectorMessage {
  return {
    ...ENVELOPE,
    type: 'print.lifecycle',
    payload: {
      event: 'STARTED',
    },
  }
}

function makePrinterTelemetry(): ConnectorMessage {
  return {
    ...ENVELOPE,
    type: 'printer.telemetry',
    payload: {
      hotendTempC: 200,
    },
  }
}

function makeConnectorError(): ConnectorMessage {
  return {
    ...ENVELOPE,
    type: 'connector.error',
    payload: {
      code: 'CONN_ERR',
      message: 'Connection lost',
      recoverable: true,
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('classifyMessage', () => {
  it('classifies heartbeat as EPHEMERAL', () => {
    expect(classifyMessage(makeHeartbeat())).toBe<MessageClass>('EPHEMERAL')
  })

  it('classifies printer.status as DURABLE', () => {
    expect(classifyMessage(makePrinterStatus())).toBe<MessageClass>('DURABLE')
  })

  it('classifies print.lifecycle as DURABLE', () => {
    expect(classifyMessage(makePrintLifecycle())).toBe<MessageClass>('DURABLE')
  })

  it('classifies printer.telemetry as EPHEMERAL', () => {
    expect(classifyMessage(makePrinterTelemetry())).toBe<MessageClass>('EPHEMERAL')
  })

  it('classifies connector.error as DURABLE', () => {
    expect(classifyMessage(makeConnectorError())).toBe<MessageClass>('DURABLE')
  })

  // -------------------------------------------------------------------------
  // Explicit regression: telemetry is ALWAYS ephemeral — never DURABLE
  // -------------------------------------------------------------------------

  it('regression: printer.telemetry is EPHEMERAL, never DURABLE', () => {
    const result = classifyMessage(makePrinterTelemetry())
    expect(result).toBe('EPHEMERAL')
    expect(result).not.toBe('DURABLE')
  })

  it('throws for an unknown message type', () => {
    const unknown = { type: 'unknown.type' } as unknown as ConnectorMessage
    expect(() => classifyMessage(unknown)).toThrow()
  })
})
