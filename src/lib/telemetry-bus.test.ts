import {
  TelemetryBus,
  printerChannel,
  tenantChannel,
  TelemetryEvent,
  LiveStateEvent,
  BusEvent,
  BusEventCallback,
} from './telemetry-bus'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTelemetry(
  tenantId: string,
  printerId: string,
  overrides: Partial<TelemetryEvent['payload']> = {}
): TelemetryEvent {
  return {
    type: 'printer.telemetry',
    tenantId,
    printerId,
    timestamp: new Date().toISOString(),
    payload: {
      hotendTempC: 215,
      bedTempC: 60,
      progressPercent: 42,
      ...overrides,
    },
  }
}

function makeState(tenantId: string, printerId: string): LiveStateEvent {
  return {
    type: 'printer.state',
    tenantId,
    printerId,
    timestamp: new Date().toISOString(),
    payload: {
      status: 'PRINTING',
      fileName: 'benchy.gcode',
      progressPercent: 42,
    },
  }
}

/** Waits for `ms` milliseconds using real timers. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TelemetryBus', () => {
  // Each test gets a fresh bus instance so state never leaks between tests.
  let bus: TelemetryBus

  beforeEach(() => {
    bus = new TelemetryBus()
  })

  // -------------------------------------------------------------------------
  // 1. Subscribe and receive published events
  // -------------------------------------------------------------------------

  describe('subscribe / publish', () => {
    it('subscriber receives a published TelemetryEvent on the correct channel', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      bus.subscribe(channel, (e) => received.push(e))

      const event = makeTelemetry('t1', 'p1')
      bus.publish(channel, event)

      expect(received).toHaveLength(1)
      expect(received[0]).toBe(event)
    })

    it('subscriber receives a published LiveStateEvent on the correct channel', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      bus.subscribe(channel, (e) => received.push(e))

      const event = makeState('t1', 'p1')
      bus.publish(channel, event)

      expect(received).toHaveLength(1)
      expect(received[0]).toBe(event)
    })

    it('subscriber on a non-matching channel does not receive events', () => {
      const received: BusEvent[] = []
      bus.subscribe(printerChannel('t1', 'p2'), (e) => received.push(e))

      bus.publish(printerChannel('t1', 'p1'), makeTelemetry('t1', 'p1'))

      expect(received).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // 2. Unsubscribe stops receiving events
  // -------------------------------------------------------------------------

  describe('unsubscribe', () => {
    it('unsubscribe via returned function stops the callback from receiving events', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      const unsub = bus.subscribe(channel, (e) => received.push(e))

      bus.publish(channel, makeTelemetry('t1', 'p1'))
      expect(received).toHaveLength(1)

      unsub()

      bus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 220 }))
      expect(received).toHaveLength(1) // still 1 — second event not delivered
    })

    it('unsubscribe via explicit unsubscribe() call stops the callback', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      const cb: BusEventCallback = (e) => received.push(e)
      bus.subscribe(channel, cb)

      bus.publish(channel, makeTelemetry('t1', 'p1'))
      expect(received).toHaveLength(1)

      bus.unsubscribe(channel, cb)

      bus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 220 }))
      expect(received).toHaveLength(1)
    })

    it('unsubscribing one listener does not affect other listeners on the same channel', () => {
      const recv1: BusEvent[] = []
      const recv2: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')

      const unsub1 = bus.subscribe(channel, (e) => recv1.push(e))
      bus.subscribe(channel, (e) => recv2.push(e))

      bus.publish(channel, makeTelemetry('t1', 'p1'))
      expect(recv1).toHaveLength(1)
      expect(recv2).toHaveLength(1)

      unsub1()

      bus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 220 }))
      expect(recv1).toHaveLength(1) // unsubscribed
      expect(recv2).toHaveLength(2) // still receiving
    })
  })

  // -------------------------------------------------------------------------
  // 3. Fan-out: printer channel → tenant-all channel
  // -------------------------------------------------------------------------

  describe('tenant-all fan-out', () => {
    it('publishing to a printer channel also delivers to the tenant-all channel', () => {
      const printerRecv: BusEvent[] = []
      const allRecv: BusEvent[] = []

      bus.subscribe(printerChannel('t1', 'p1'), (e) => printerRecv.push(e))
      bus.subscribe(tenantChannel('t1'), (e) => allRecv.push(e))

      const event = makeTelemetry('t1', 'p1')
      bus.publish(printerChannel('t1', 'p1'), event)

      expect(printerRecv).toHaveLength(1)
      expect(allRecv).toHaveLength(1)
      expect(allRecv[0]).toBe(event)
    })

    it('publishing directly to the tenant-all channel does NOT double-fan-out', () => {
      const allRecv: BusEvent[] = []
      bus.subscribe(tenantChannel('t1'), (e) => allRecv.push(e))

      const event = makeTelemetry('t1', 'p1')
      bus.publish(tenantChannel('t1'), event)

      expect(allRecv).toHaveLength(1)
    })

    it('fan-out works for LiveStateEvents as well', () => {
      const allRecv: BusEvent[] = []
      bus.subscribe(tenantChannel('t1'), (e) => allRecv.push(e))

      bus.publish(printerChannel('t1', 'p1'), makeState('t1', 'p1'))

      expect(allRecv).toHaveLength(1)
      expect(allRecv[0].type).toBe('printer.state')
    })
  })

  // -------------------------------------------------------------------------
  // 4. High-frequency dedup
  // -------------------------------------------------------------------------

  describe('telemetry deduplication', () => {
    // Use a short window so the wait in tests is minimal.
    const DEDUP_MS = 50
    let dedupBus: TelemetryBus

    beforeEach(() => {
      dedupBus = new TelemetryBus(DEDUP_MS)
    })

    it('identical payload within the dedup window is dropped (only first is delivered)', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      dedupBus.subscribe(channel, (e) => received.push(e))

      const event1 = makeTelemetry('t1', 'p1', { hotendTempC: 215 })
      const event2 = makeTelemetry('t1', 'p1', { hotendTempC: 215 }) // same payload

      dedupBus.publish(channel, event1)
      dedupBus.publish(channel, event2)

      expect(received).toHaveLength(1)
      expect(received[0]).toBe(event1)
    })

    it('different payload within the dedup window is NOT dropped', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      dedupBus.subscribe(channel, (e) => received.push(e))

      dedupBus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 215 }))
      dedupBus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 216 })) // changed

      expect(received).toHaveLength(2)
    })

    it('same payload after the dedup window expires IS delivered', async () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      dedupBus.subscribe(channel, (e) => received.push(e))

      dedupBus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 215 }))
      expect(received).toHaveLength(1)

      // Wait for the window to expire
      await wait(DEDUP_MS + 20)

      dedupBus.publish(channel, makeTelemetry('t1', 'p1', { hotendTempC: 215 }))
      expect(received).toHaveLength(2)
    })

    it('dedup is keyed per printer: different printer with same payload both get through', () => {
      const recv1: BusEvent[] = []
      const recv2: BusEvent[] = []

      dedupBus.subscribe(printerChannel('t1', 'p1'), (e) => recv1.push(e))
      dedupBus.subscribe(printerChannel('t1', 'p2'), (e) => recv2.push(e))

      dedupBus.publish(printerChannel('t1', 'p1'), makeTelemetry('t1', 'p1', { hotendTempC: 215 }))
      dedupBus.publish(printerChannel('t1', 'p2'), makeTelemetry('t1', 'p2', { hotendTempC: 215 }))

      expect(recv1).toHaveLength(1)
      expect(recv2).toHaveLength(1)

      // Second publish to each should be deduped
      dedupBus.publish(printerChannel('t1', 'p1'), makeTelemetry('t1', 'p1', { hotendTempC: 215 }))
      dedupBus.publish(printerChannel('t1', 'p2'), makeTelemetry('t1', 'p2', { hotendTempC: 215 }))

      expect(recv1).toHaveLength(1)
      expect(recv2).toHaveLength(1)
    })

    it('LiveStateEvents are never deduped even when payloads are identical', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      dedupBus.subscribe(channel, (e) => received.push(e))

      const state1 = makeState('t1', 'p1')
      const state2 = makeState('t1', 'p1') // same payload shape

      dedupBus.publish(channel, state1)
      dedupBus.publish(channel, state2)

      expect(received).toHaveLength(2)
    })

    it('dedup considers all payload fields: partial overlap is treated as different', () => {
      const received: BusEvent[] = []
      const channel = printerChannel('t1', 'p1')
      dedupBus.subscribe(channel, (e) => received.push(e))

      dedupBus.publish(
        channel,
        makeTelemetry('t1', 'p1', { hotendTempC: 215, progressPercent: 40 })
      )
      dedupBus.publish(
        channel,
        makeTelemetry('t1', 'p1', { hotendTempC: 215, progressPercent: 41 }) // progressPercent changed
      )

      expect(received).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  // 5. Multiple subscribers on the same channel each receive events
  // -------------------------------------------------------------------------

  describe('multiple subscribers', () => {
    it('all subscribers on the same channel receive the event', () => {
      const results: number[] = []
      const channel = printerChannel('t1', 'p1')

      bus.subscribe(channel, () => results.push(1))
      bus.subscribe(channel, () => results.push(2))
      bus.subscribe(channel, () => results.push(3))

      bus.publish(channel, makeTelemetry('t1', 'p1'))

      expect(results).toEqual([1, 2, 3])
    })

    it('subscribers on different channels are independent', () => {
      const recv1: BusEvent[] = []
      const recv2: BusEvent[] = []

      bus.subscribe(printerChannel('t1', 'p1'), (e) => recv1.push(e))
      bus.subscribe(printerChannel('t1', 'p2'), (e) => recv2.push(e))

      bus.publish(printerChannel('t1', 'p1'), makeTelemetry('t1', 'p1'))

      expect(recv1).toHaveLength(1)
      expect(recv2).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // 6. No cross-tenant leakage
  // -------------------------------------------------------------------------

  describe('cross-tenant isolation', () => {
    it('publishing to tenant A printer channel does not reach tenant B subscribers', () => {
      const tenantARecv: BusEvent[] = []
      const tenantBRecv: BusEvent[] = []

      bus.subscribe(printerChannel('tenantA', 'p1'), (e) => tenantARecv.push(e))
      bus.subscribe(printerChannel('tenantB', 'p1'), (e) => tenantBRecv.push(e))
      bus.subscribe(tenantChannel('tenantB'), (e) => tenantBRecv.push(e))

      bus.publish(printerChannel('tenantA', 'p1'), makeTelemetry('tenantA', 'p1'))

      expect(tenantARecv).toHaveLength(1)
      expect(tenantBRecv).toHaveLength(0)
    })

    it('tenant-all channel for tenant A does not reach tenant B subscribers', () => {
      const tenantAAll: BusEvent[] = []
      const tenantBAll: BusEvent[] = []

      bus.subscribe(tenantChannel('tenantA'), (e) => tenantAAll.push(e))
      bus.subscribe(tenantChannel('tenantB'), (e) => tenantBAll.push(e))

      bus.publish(printerChannel('tenantA', 'p1'), makeTelemetry('tenantA', 'p1'))

      expect(tenantAAll).toHaveLength(1)
      expect(tenantBAll).toHaveLength(0)
    })

    it('channel tenant takes precedence over event.tenantId for fan-out', () => {
      const tenantBAll: BusEvent[] = []
      const tenantAAll: BusEvent[] = []
      bus.subscribe(tenantChannel('tenantB'), (e) => tenantBAll.push(e))
      bus.subscribe(tenantChannel('tenantA'), (e) => tenantAAll.push(e))

      // channel says tenantB but event claims tenantA
      const event = makeTelemetry('tenantA', 'p1')
      bus.publish(printerChannel('tenantB', 'p1'), event)

      // Fan-out should go to tenantB (from channel), NOT tenantA (from event)
      expect(tenantBAll).toHaveLength(1)
      expect(tenantAAll).toHaveLength(0)
    })

    it('dedup state is isolated per tenant: same printer ID under different tenants is not conflated', async () => {
      const DEDUP_MS = 50
      const isolatedBus = new TelemetryBus(DEDUP_MS)
      const recvA: BusEvent[] = []
      const recvB: BusEvent[] = []

      isolatedBus.subscribe(printerChannel('tenantA', 'p1'), (e) => recvA.push(e))
      isolatedBus.subscribe(printerChannel('tenantB', 'p1'), (e) => recvB.push(e))

      // Same payload, same printerId but different tenants
      isolatedBus.publish(
        printerChannel('tenantA', 'p1'),
        makeTelemetry('tenantA', 'p1', { hotendTempC: 215 })
      )
      isolatedBus.publish(
        printerChannel('tenantA', 'p1'),
        makeTelemetry('tenantA', 'p1', { hotendTempC: 215 }) // dup within window
      )
      isolatedBus.publish(
        printerChannel('tenantB', 'p1'),
        makeTelemetry('tenantB', 'p1', { hotendTempC: 215 }) // different tenant — should pass
      )

      expect(recvA).toHaveLength(1)
      expect(recvB).toHaveLength(1)
    })
  })

  // -------------------------------------------------------------------------
  // Channel helper functions
  // -------------------------------------------------------------------------

  describe('channel helpers', () => {
    it('printerChannel returns expected format', () => {
      expect(printerChannel('tenant123', 'printer456')).toBe(
        'tenant:tenant123:printer:printer456'
      )
    })

    it('tenantChannel returns expected format', () => {
      expect(tenantChannel('tenant123')).toBe('tenant:tenant123:printers:all')
    })
  })
})
