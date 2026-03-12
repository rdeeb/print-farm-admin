'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <PrinterLoaderIcon size={64} color="#4f46e5" />
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-64">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)} />
          </div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-shrink-0 w-14" />
        </div>
      )}
    </div>
  )
}
