import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '3D Farm Admin',
  description: 'Comprehensive 3D printing farm management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  )
}