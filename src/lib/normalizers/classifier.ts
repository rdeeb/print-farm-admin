/**
 * Message classifier — determines whether a connector message should be
 * persisted to the database (DURABLE) or only forwarded via SSE (EPHEMERAL).
 *
 * Classification rules (from the implementation plan Data Classification Rules):
 *   printer.telemetry → EPHEMERAL  (never stored in DB)
 *   heartbeat         → EPHEMERAL  (just updates lease/lastSeen)
 *   printer.status    → DURABLE
 *   print.lifecycle   → DURABLE
 *   connector.error   → DURABLE
 */

import type { ConnectorMessage } from './types'

export type MessageClass = 'DURABLE' | 'EPHEMERAL'

/**
 * Classify a validated ConnectorMessage as DURABLE or EPHEMERAL.
 *
 * DURABLE messages must be written to `PrinterEvent` and trigger a
 * `PrinterLiveState` upsert.
 *
 * EPHEMERAL messages are forwarded to SSE subscribers only; they must never
 * be written to the database.
 */
export function classifyMessage(msg: ConnectorMessage): MessageClass {
  switch (msg.type) {
    case 'printer.status':
    case 'print.lifecycle':
    case 'connector.error':
      return 'DURABLE'

    case 'heartbeat':
    case 'printer.telemetry':
      return 'EPHEMERAL'

    default: {
      // TypeScript exhaustiveness guard — msg.type is `never` here if all
      // cases are covered.  Cast to string so the error message is useful.
      const exhaustive: never = msg
      throw new Error(
        `classifyMessage: unhandled message type "${(exhaustive as { type: string }).type}"`
      )
    }
  }
}
