import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PrintFleet — Print Farm Order Management',
  description:
    'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
  openGraph: {
    title: 'PrintFleet — Print Farm Order Management',
    description:
      'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
    url: 'https://printfleet.app',
    siteName: 'PrintFleet',
    images: [
      {
        url: 'https://printfleet.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrintFleet — Print Farm Order Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrintFleet — Print Farm Order Management',
    description:
      'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
    images: ['https://printfleet.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
