/** @jest-environment node */

// ---------------------------------------------------------------------------
// Mock @/lib/prisma BEFORE any imports that depend on it
// ---------------------------------------------------------------------------

const mockPrinterEventCreate = jest.fn()
const mockPrinterLiveStateUpsert = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        printerEvent: {
          create: (...args: unknown[]) => mockPrinterEventCreate(...args),
        },
        printerLiveState: {
          upsert: (...args: unknown[]) => mockPrinterLiveStateUpsert(...args),
        },
      }
      return fn(tx)
    },
    printerEvent: {
      create: (...args: unknown[]) => mockPrinterEventCreate(...args),
    },
    printerLiveState: {
      upsert: (...args: unknown[]) => mockPrinterLiveStateUpsert(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { PrinterEventType, PrinterStatus } from '@prisma/client'
import { processDurableEvent, updateLiveStateTelemetry } from './event-processor'
import type { NormalizedStatusEvent, NormalizedLifecycleEvent, NormalizedErrorEvent } from './normalizers/bambu'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const OPTS = {
  tenantId: 'tenant-1',
  printerId: 'printer-1',
  connectorSessionId: 'session-1',
  occurredAt: new Date('2026-03-13T10:00:00.000Z'),
}

// ---------------------------------------------------------------------------
// processDurableEvent — STATUS_CHANGED
// ---------------------------------------------------------------------------

describe('processDurableEvent — STATUS_CHANGED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-1' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('writes a PrinterEvent row with STATUS_CHANGED', async () => {
    const normalized: NormalizedStatusEvent = {
      eventType: PrinterEventType.STATUS_CHANGED,
      printerStatus: PrinterStatus.IDLE,
      payload: { status: 'IDLE', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    expect(mockPrinterEventCreate).toHaveBeenCalledTimes(1)
    const createCall = mockPrinterEventCreate.mock.calls[0][0]
    expect(createCall.data.eventType).toBe(PrinterEventType.STATUS_CHANGED)
    expect(createCall.data.printerStatus).toBe(PrinterStatus.IDLE)
    expect(createCall.data.tenantId).toBe('tenant-1')
    expect(createCall.data.printerId).toBe('printer-1')
    expect(createCall.data.connectorSessionId).toBe('session-1')
  })

  it('upserts PrinterLiveState with correct status for STATUS_CHANGED', async () => {
    const normalized: NormalizedStatusEvent = {
      eventType: PrinterEventType.STATUS_CHANGED,
      printerStatus: PrinterStatus.PRINTING,
      payload: { status: 'PRINTING', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    expect(mockPrinterLiveStateUpsert).toHaveBeenCalledTimes(1)
    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.PRINTING)
  })

  it('sets lastError when status is ERROR', async () => {
    const normalized: NormalizedStatusEvent = {
      eventType: PrinterEventType.STATUS_CHANGED,
      printerStatus: PrinterStatus.ERROR,
      payload: { status: 'ERROR', accessMode: 'LOCAL_FULL', errorMessage: 'Nozzle jam' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.lastError).toBe('Nozzle jam')
  })

  it('clears lastError when status is not ERROR', async () => {
    const normalized: NormalizedStatusEvent = {
      eventType: PrinterEventType.STATUS_CHANGED,
      printerStatus: PrinterStatus.IDLE,
      payload: { status: 'IDLE', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.lastError).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_STARTED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_STARTED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-2' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('sets platformJobId and fileName in live state', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_STARTED,
      platformJobId: 'job-99',
      fileName: 'benchy.3mf',
      payload: { event: 'STARTED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.PRINTING)
    expect(upsertCall.update.platformJobId).toBe('job-99')
    expect(upsertCall.update.fileName).toBe('benchy.3mf')
  })

  it('sets platformJobId and fileName on create side of upsert', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_STARTED,
      platformJobId: 'job-99',
      fileName: 'benchy.3mf',
      payload: { event: 'STARTED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.create.platformJobId).toBe('job-99')
    expect(upsertCall.create.fileName).toBe('benchy.3mf')
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_COMPLETED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_COMPLETED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-3' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('clears platformJobId and fileName on completion', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_COMPLETED,
      payload: { event: 'COMPLETED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.IDLE)
    expect(upsertCall.update.platformJobId).toBeNull()
    expect(upsertCall.update.fileName).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_CANCELLED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_CANCELLED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-4' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('clears platformJobId and fileName on cancellation', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_CANCELLED,
      payload: { event: 'CANCELLED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.IDLE)
    expect(upsertCall.update.platformJobId).toBeNull()
    expect(upsertCall.update.fileName).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// updateLiveStateTelemetry
// ---------------------------------------------------------------------------

describe('updateLiveStateTelemetry', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('updates progressPercent and remainingSeconds only', async () => {
    await updateLiveStateTelemetry('tenant-1', 'printer-1', {
      progressPercent: 42,
      remainingSeconds: 600,
    })

    expect(mockPrinterLiveStateUpsert).toHaveBeenCalledTimes(1)
    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.progressPercent).toBe(42)
    expect(upsertCall.update.remainingSeconds).toBe(600)
  })

  it('does NOT write temperature, fan speed, or layer fields', async () => {
    await updateLiveStateTelemetry('tenant-1', 'printer-1', {
      progressPercent: 50,
    })

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.hotendTempC).toBeUndefined()
    expect(upsertCall.update.bedTempC).toBeUndefined()
    expect(upsertCall.update.fanSpeedPercent).toBeUndefined()
    expect(upsertCall.update.layerCurrent).toBeUndefined()
    expect(upsertCall.update.layerTotal).toBeUndefined()
  })

  it('skips the DB call entirely when no telemetry fields are provided', async () => {
    await updateLiveStateTelemetry('tenant-1', 'printer-1', {})
    expect(mockPrinterLiveStateUpsert).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Regression: telemetry updates must NOT call printerEvent.create
  // -------------------------------------------------------------------------

  it('regression: does NOT call prisma.printerEvent.create (telemetry is not durable)', async () => {
    await updateLiveStateTelemetry('tenant-1', 'printer-1', {
      progressPercent: 75,
      remainingSeconds: 300,
    })

    expect(mockPrinterEventCreate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_FAILED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_FAILED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-5' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('sets status to ERROR and clears platformJobId and fileName', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_FAILED,
      payload: { event: 'FAILED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.ERROR)
    expect(upsertCall.update.platformJobId).toBeNull()
    expect(upsertCall.update.fileName).toBeNull()
  })

  it('sets lastError from payload errorMessage', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_FAILED,
      payload: { event: 'FAILED', accessMode: 'LOCAL_FULL', errorMessage: 'Nozzle clog' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.lastError).toBe('Nozzle clog')
  })

  it('sets lastError to default sentinel when no errorMessage in payload', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_FAILED,
      payload: { event: 'FAILED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.lastError).toBe('Print failed')
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_PAUSED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_PAUSED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-6' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('sets status to PAUSED', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_PAUSED,
      payload: { event: 'PAUSED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.PAUSED)
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — PRINT_RESUMED
// ---------------------------------------------------------------------------

describe('processDurableEvent — PRINT_RESUMED', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-7' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('sets status to PRINTING', async () => {
    const normalized: NormalizedLifecycleEvent = {
      eventType: PrinterEventType.PRINT_RESUMED,
      payload: { event: 'RESUMED', accessMode: 'LOCAL_FULL' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.status).toBe(PrinterStatus.PRINTING)
  })
})

// ---------------------------------------------------------------------------
// processDurableEvent — NormalizedErrorEvent (connector.error)
// ---------------------------------------------------------------------------

describe('processDurableEvent — NormalizedErrorEvent', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPrinterEventCreate.mockResolvedValue({ id: 'evt-8' })
    mockPrinterLiveStateUpsert.mockResolvedValue({})
  })

  it('writes a PrinterEvent row with eventType ERROR', async () => {
    const normalized: NormalizedErrorEvent = {
      eventType: PrinterEventType.ERROR,
      payload: { errorCode: 'CONN_TIMEOUT', errorMessage: 'Connection timed out' },
    }

    await processDurableEvent(normalized, OPTS)

    expect(mockPrinterEventCreate).toHaveBeenCalledTimes(1)
    const createCall = mockPrinterEventCreate.mock.calls[0][0]
    expect(createCall.data.eventType).toBe('ERROR')
  })

  it('sets lastError in live state from errorMessage in payload', async () => {
    const normalized: NormalizedErrorEvent = {
      eventType: PrinterEventType.ERROR,
      payload: { errorCode: 'CONN_TIMEOUT', errorMessage: 'Connection timed out' },
    }

    await processDurableEvent(normalized, OPTS)

    const upsertCall = mockPrinterLiveStateUpsert.mock.calls[0][0]
    expect(upsertCall.update.lastError).toBe('Connection timed out')
  })
})
