import { EventEmitter } from 'events'

// ---------------------------------------------------------------------------
// Typed event interfaces
// ---------------------------------------------------------------------------

export interface TelemetryEvent {
  type: 'printer.telemetry'
  tenantId: string
  printerId: string
  /** ISO 8601 timestamp */
  timestamp: string
  payload: {
    hotendTempC?: number
    bedTempC?: number
    progressPercent?: number
    fanSpeedPercent?: number
    layerCurrent?: number
    layerTotal?: number
    speedMmPerSec?: number
    remainingSeconds?: number
  }
}

export interface LiveStateEvent {
  type: 'printer.state'
  tenantId: string
  printerId: string
  /** ISO 8601 timestamp */
  timestamp: string
  payload: {
    status: string
    platformJobId?: string
    fileName?: string
    progressPercent?: number
    remainingSeconds?: number
    lastError?: string
  }
}

export type BusEvent = TelemetryEvent | LiveStateEvent

// Callback type for subscribers
export type BusEventCallback = (event: BusEvent) => void

// ---------------------------------------------------------------------------
// Channel helpers
// ---------------------------------------------------------------------------

/**
 * Returns the printer-scoped channel name.
 *   e.g. "tenant:abc:printer:xyz"
 */
export function printerChannel(tenantId: string, printerId: string): string {
  return `tenant:${tenantId}:printer:${printerId}`
}

/**
 * Returns the tenant-wide broadcast channel name.
 *   e.g. "tenant:abc:printers:all"
 */
export function tenantChannel(tenantId: string): string {
  return `tenant:${tenantId}:printers:all`
}

// ---------------------------------------------------------------------------
// Dedup entry (used internally)
// ---------------------------------------------------------------------------

interface DedupEntry {
  payloadHash: string
  expiresAt: number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function payloadHash(payload: TelemetryEvent['payload']): string {
  // JSON.stringify with sorted keys gives a stable representation
  // for objects whose key insertion order may vary.
  const sorted = Object.fromEntries(
    Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))
  )
  return JSON.stringify(sorted)
}

// ---------------------------------------------------------------------------
// TelemetryBus
// ---------------------------------------------------------------------------

export class TelemetryBus {
  private readonly emitter: EventEmitter

  /**
   * Window (ms) within which a duplicate telemetry payload is suppressed.
   * Default: 100 ms. Pass a smaller value in tests to keep them fast.
   */
  private readonly dedupWindowMs: number

  /**
   * Map keyed by "tenantId:printerId" → last dedup entry.
   * Only used for TelemetryEvents; LiveStateEvents are never deduped.
   */
  private readonly dedupCache = new Map<string, DedupEntry>()

  constructor(dedupWindowMs = 100) {
    this.emitter = new EventEmitter()
    // Allow many SSE clients per channel without triggering Node's default
    // MaxListenersExceededWarning.
    this.emitter.setMaxListeners(1000)
    this.dedupWindowMs = dedupWindowMs
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a channel. Returns an unsubscribe function.
   *
   * @param channel  Use `printerChannel()` or `tenantChannel()` helpers.
   * @param callback Invoked for each event published to this channel.
   */
  subscribe(channel: string, callback: BusEventCallback): () => void {
    this.emitter.on(channel, callback)
    return () => this.unsubscribe(channel, callback)
  }

  /**
   * Unsubscribe a previously registered callback from a channel.
   */
  unsubscribe(channel: string, callback: BusEventCallback): void {
    this.emitter.off(channel, callback)
  }

  /**
   * Publish an event.
   *
   * - For TelemetryEvents: applies dedup before emitting. If the payload is
   *   identical to the last one published for this printer within the dedup
   *   window the event is silently dropped.
   * - For printer-scoped publishes: also fans out to the tenant-wide channel.
   * - LiveStateEvents are always forwarded (no dedup).
   *
   * The channel argument must be a printer channel (`printerChannel()`);
   * the tenant-wide fanout is automatic.  You may also publish directly to
   * a tenant channel if needed (no fanout in that case).
   */
  publish(channel: string, event: BusEvent): void {
    // Dedup gate — only for high-frequency telemetry events
    if (event.type === 'printer.telemetry') {
      const hash = payloadHash(event.payload)
      if (this.isDuplicate(event, hash)) {
        return
      }
      this.recordDedup(event, hash)
    }

    // Emit on the target channel
    this.emitter.emit(channel, event)

    // Fan out to tenant-wide channel when the channel is printer-scoped
    const match = /^tenant:([^:]+):printer:/.exec(channel)
    if (match) {
      this.emitter.emit(tenantChannel(match[1]), event)
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private dedupKey(event: TelemetryEvent): string {
    return `${event.tenantId}:${event.printerId}`
  }

  private isDuplicate(event: TelemetryEvent, hash: string): boolean {
    const key = this.dedupKey(event)
    const entry = this.dedupCache.get(key)
    if (!entry) return false
    const now = Date.now()
    if (now >= entry.expiresAt) {
      this.dedupCache.delete(key)
      return false
    }
    return entry.payloadHash === hash
  }

  private recordDedup(event: TelemetryEvent, hash: string): void {
    const key = this.dedupKey(event)
    this.dedupCache.set(key, {
      payloadHash: hash,
      expiresAt: Date.now() + this.dedupWindowMs,
    })
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const telemetryBus = new TelemetryBus()
