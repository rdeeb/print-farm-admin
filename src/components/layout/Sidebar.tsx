'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Box,
  Calendar,
  FileText,
  Home,
  Package,
  Printer,
  ListOrdered,
  Settings,
  Users,
  Building2,
  UserCircle,
  Wrench,
} from 'lucide-react'
import type { NavigationItem } from '@/model/navigation'

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Orders', href: '/orders', icon: FileText },
  { name: 'Clients', href: '/clients', icon: UserCircle },
  { name: 'Projects', href: '/projects', icon: Box },
  { name: 'Print Queue', href: '/queue', icon: ListOrdered },
  { name: 'Printers', href: '/printers', icon: Printer },
  { name: 'Filament', href: '/filament', icon: Package },
  { name: 'Hardware', href: '/hardware', icon: Wrench },
  { name: 'Inventory', href: '/inventory', icon: Building2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(session?.user?.role || '')
  })

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Printer className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {session?.user?.tenant?.name}
                </p>
                <p className="text-xs text-gray-300">
                  {session?.user?.role}
                </p>
              </div>
            </div>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive
                        ? 'text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex bg-gray-700 p-4">
          <div className="flex items-center">
            <div>
              <div className="h-8 w-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-300">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}