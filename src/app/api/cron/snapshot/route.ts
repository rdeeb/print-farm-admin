export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { pushCurrentSnapshot } from '@/lib/sa-connector'

/**
 * GET /api/cron/snapshot
 *
 * Pushes a state snapshot to the SA dashboard.
 * Intended to be called by an external cron scheduler every hour.
 *
 * Protected by CRON_SECRET — callers must pass it as a Bearer token:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Dokku / any Linux host:
 *   crontab -e
 *   0 * * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" https://your-app.example.com/api/cron/snapshot
 *
 * Vercel:
 *   Add to vercel.json: { "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 * * * *" }] }
 *   Vercel injects CRON_SECRET automatically; no Authorization header needed.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  await pushCurrentSnapshot()
  return NextResponse.json({ ok: true })
}
