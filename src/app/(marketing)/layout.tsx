import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3D Farm Admin — Print Farm Order Management',
  description:
    'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
  openGraph: {
    title: '3D Farm Admin — Print Farm Order Management',
    description:
      'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
    url: 'https://3dfarmadmin.com',
    siteName: '3D Farm Admin',
    images: [
      {
        url: 'https://3dfarmadmin.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '3D Farm Admin — Print Farm Order Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Farm Admin — Print Farm Order Management',
    description:
      'The order management system built for 3D print farms. Track costs, manage orders, and see your real profit per job.',
    images: ['https://3dfarmadmin.com/og-image.png'],
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
