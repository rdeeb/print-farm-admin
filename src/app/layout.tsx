import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { Toaster } from '@/components/ui/toaster'
import { CookieConsent } from '@/components/CookieConsent'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
const OfflineIndicator = dynamic(
  () => import('@/components/OfflineIndicator'),
  { ssr: false }
)

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrintFleet — The operating system for modern print farms',
  description:
    'Operate your 3D printer fleet from one dashboard. Monitor every printer, detect failures instantly, and scale your printing operation without babysitting machines.',
  openGraph: {
    title: 'PrintFleet — The operating system for modern print farms',
    description:
      'Operate your 3D printer fleet from one dashboard. Monitor every printer, detect failures instantly, and scale your printing operation without babysitting machines.',
    url: 'https://printfleet.app',
    siteName: 'PrintFleet',
    images: [
      {
        url: 'https://printfleet.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrintFleet — The operating system for modern print farms',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrintFleet — The operating system for modern print farms',
    description:
      'Operate your 3D printer fleet from one dashboard. Monitor every printer, detect failures instantly, and scale your printing operation without babysitting machines.',
    images: ['https://printfleet.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineIndicator />
        <GoogleAnalytics />
        <SessionProvider>
          <SettingsProvider>
            {children}
            <Toaster />
            <CookieConsent />
          </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  )
}