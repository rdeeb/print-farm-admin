import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProtectedShell from './components/ProtectedShell'

// Routes under (protected) that are exempt from the subscription gate
// (the /subscribe page itself lives outside this layout group)
const SUBSCRIPTION_GATE_EXEMPT: string[] = []

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect unauthenticated users at the server level
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    redirect('/auth/signin')
  }

  // #9 + #10 + #11: Subscription enforcement — server-side, no DB calls in middleware
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
      select: {
        tier: true,
        status: true,
        trialEndsAt: true,
      },
    })

    if (subscription) {
      const isTrial = subscription.tier === 'TRIAL'

      // #10: A subscription is blocking only if:
      //   - tier is TRIAL, AND
      //   - trialEndsAt is in the past, AND
      //   - status is NOT 'active' (active paid subscription is always valid)
      const isTrialExpired =
        isTrial &&
        subscription.trialEndsAt !== null &&
        new Date() > subscription.trialEndsAt

      const isBlocking = isTrialExpired && subscription.status !== 'active'

      if (isBlocking) {
        redirect('/subscribe')
      }
    }
  } catch (err) {
    // DB failure must not block authenticated users — log and continue
    console.error('Protected layout subscription check error:', err)
  }

  return <ProtectedShell>{children}</ProtectedShell>
}
