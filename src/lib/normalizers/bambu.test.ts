/** @jest-environment node */

import { normalizeBambuStatus, normalizeBambuLifecycle } from './bambu'
import type { BambuPrinterStatusMessage, BambuPrintLifecycleMessage } from './types'
import { PrinterEventType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENVELOPE = {
  schemaVersion: 1 as const,
  timestamp: '2026-03-13T10:00:00.000Z',
  tenantId: 'tenant-1',
  printerExternalId: 'printer-1',
}

function makeStatusMsg(
  status: string,
  extras: Record<string, unknown> = {},
  accessMode: 'LOCAL_FULL' | 'READ_ONLY_FALLBACK' = 'LOCAL_FULL'
): BambuPrinterStatusMessage {
  return {
    ...ENVELOPE,
    type: 'printer.status',
    payload: {
      status: status as BambuPrinterStatusMessage['payload']['status'],
      accessMode,
      ...extras,
    },
  }
}

function makeLifecycleMsg(
  event: string,
  extras: Record<string, unknown> = {},
  accessMode: 'LOCAL_FULL' | 'READ_ONLY_FALLBACK' = 'LOCAL_FULL'
): BambuPrintLifecycleMessage {
  return {
    ...ENVELOPE,
    type: 'print.lifecycle',
    payload: {
      event: event as BambuPrintLifecycleMessage['payload']['event'],
      accessMode,
      ...extras,
    },
  }
}

// ---------------------------------------------------------------------------
// normalizeBambuStatus
// ---------------------------------------------------------------------------

describe('normalizeBambuStatus', () => {
  const statuses = ['IDLE', 'PRINTING', 'PAUSED', 'ERROR', 'MAINTENANCE', 'OFFLINE'] as const

  it.each(statuses)('maps status %s correctly', (status) => {
    const msg = makeStatusMsg(status, status === 'ERROR' ? { errorMessage: 'boom' } : {})
    const result = normalizeBambuStatus(msg)
    expect(result.eventType).toBe(PrinterEventType.STATUS_CHANGED)
    expect(result.printerStatus).toBe(status)
  })

  it('includes platformJobId and fileName in output when present', () => {
    const msg = makeStatusMsg('PRINTING', {
      platformJobId: 'job-42',
      fileName: 'benchy.3mf',
    })
    const result = normalizeBambuStatus(msg)
    expect(result.platformJobId).toBe('job-42')
    expect(result.fileName).toBe('benchy.3mf')
    expect(result.payload.platformJobId).toBe('job-42')
    expect(result.payload.fileName).toBe('benchy.3mf')
  })

  it('stores accessMode in payload', () => {
    const msg = makeStatusMsg('IDLE')
    const result = normalizeBambuStatus(msg)
    expect(result.payload.accessMode).toBe('LOCAL_FULL')
  })

  // -------------------------------------------------------------------------
  // accessMode: READ_ONLY_FALLBACK
  // -------------------------------------------------------------------------

  it('READ_ONLY_FALLBACK mode includes degradedMode: true in payload', () => {
    const msg = makeStatusMsg('IDLE', {}, 'READ_ONLY_FALLBACK')
    const result = normalizeBambuStatus(msg)
    expect(result.payload.degradedMode).toBe(true)
  })

  it('LOCAL_FULL mode does NOT include degradedMode in payload', () => {
    const msg = makeStatusMsg('IDLE', {}, 'LOCAL_FULL')
    const result = normalizeBambuStatus(msg)
    expect(result.payload.degradedMode).toBeUndefined()
  })

  it('throws on unknown status value', () => {
    const msg = makeStatusMsg('CALIBRATING' as any)
    expect(() => normalizeBambuStatus(msg)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// normalizeBambuLifecycle
// ---------------------------------------------------------------------------

describe('normalizeBambuLifecycle', () => {
  const lifecycleCases: [string, PrinterEventType][] = [
    ['STARTED', PrinterEventType.PRINT_STARTED],
    ['PAUSED', PrinterEventType.PRINT_PAUSED],
    ['RESUMED', PrinterEventType.PRINT_RESUMED],
    ['COMPLETED', PrinterEventType.PRINT_COMPLETED],
    ['FAILED', PrinterEventType.PRINT_FAILED],
    ['CANCELLED', PrinterEventType.PRINT_CANCELLED],
  ]

  it.each(lifecycleCases)('maps lifecycle event %s to %s', (event, expectedType) => {
    const msg = makeLifecycleMsg(event)
    const result = normalizeBambuLifecycle(msg)
    expect(result.eventType).toBe(expectedType)
  })

  it('includes platformJobId and fileName in output when present', () => {
    const msg = makeLifecycleMsg('STARTED', {
      platformJobId: 'job-7',
      fileName: 'cube.3mf',
    })
    const result = normalizeBambuLifecycle(msg)
    expect(result.platformJobId).toBe('job-7')
    expect(result.fileName).toBe('cube.3mf')
    expect(result.payload.platformJobId).toBe('job-7')
    expect(result.payload.fileName).toBe('cube.3mf')
  })

  it('includes elapsedSeconds and estimatedSeconds in payload when present', () => {
    const msg = makeLifecycleMsg('COMPLETED', {
      elapsedSeconds: 3600,
      estimatedSeconds: 3500,
    })
    const result = normalizeBambuLifecycle(msg)
    expect(result.payload.elapsedSeconds).toBe(3600)
    expect(result.payload.estimatedSeconds).toBe(3500)
  })

  // -------------------------------------------------------------------------
  // accessMode: READ_ONLY_FALLBACK
  // -------------------------------------------------------------------------

  it('READ_ONLY_FALLBACK mode includes degradedMode: true in payload', () => {
    const msg = makeLifecycleMsg('STARTED', {}, 'READ_ONLY_FALLBACK')
    const result = normalizeBambuLifecycle(msg)
    expect(result.payload.degradedMode).toBe(true)
  })

  it('LOCAL_FULL mode does NOT include degradedMode in payload', () => {
    const msg = makeLifecycleMsg('STARTED', {}, 'LOCAL_FULL')
    const result = normalizeBambuLifecycle(msg)
    expect(result.payload.degradedMode).toBeUndefined()
  })

  it('throws on unknown lifecycle event', () => {
    const msg = makeLifecycleMsg('ABORTED' as any)
    expect(() => normalizeBambuLifecycle(msg)).toThrow('unknown lifecycle event')
  })
})
