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
  Wallet,
} from 'lucide-react'
import type { NavigationItem, NavigationSection } from '@/model/navigation'

function navItem(
  name: string,
  href: string,
  icon: NavigationItem['icon'],
  roles?: string[]
): NavigationItem {
  return { name, href, icon, ...(roles?.length ? { roles } : {}) }
}

const navigationSections: NavigationSection[] = [
  { type: 'item', item: navItem('Dashboard', '/dashboard', Home) },
  {
    type: 'group',
    group: {
      label: 'Business',
      items: [
        navItem('Orders', '/orders', FileText),
        navItem('Clients', '/clients', UserCircle),
        navItem('Projects', '/projects', Box),
      ],
    },
  },
  {
    type: 'group',
    group: {
      label: 'Production',
      items: [
        navItem('Print Queue', '/queue', ListOrdered),
        navItem('Printers', '/printers', Printer),
        navItem('Materials', '/filament', Package),
      ],
    },
  },
  {
    type: 'group',
    group: {
      label: 'Resources',
      items: [
        navItem('Hardware', '/hardware', Wrench),
        navItem('Inventory', '/inventory', Building2),
      ],
    },
  },
  {
    type: 'group',
    group: {
      label: 'Finance & insights',
      items: [
        navItem('Finance', '/finance', Wallet),
        navItem('Analytics', '/analytics', BarChart3),
      ],
    },
  },
  {
    type: 'group',
    group: {
      label: 'Planning',
      items: [navItem('Calendar', '/calendar', Calendar)],
    },
  },
  {
    type: 'group',
    group: {
      label: 'Administration',
      items: [
        navItem('Users', '/users', Users, ['ADMIN']),
        navItem('Settings', '/settings', Settings, ['ADMIN']),
      ],
    },
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const userRole = session?.user?.role || ''

  const filterItemsByRole = (items: NavigationItem[]) =>
    items.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(userRole)
    })

  const renderNavLink = (item: NavigationItem) => {
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
  }

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
          <nav className="mt-8 flex-1 px-2 space-y-6">
            {navigationSections.map((section, sectionIndex) => {
              if (section.type === 'item') {
                if (section.item.roles && !section.item.roles.includes(userRole))
                  return null
                return (
                  <div key={section.item.name}>{renderNavLink(section.item)}</div>
                )
              }
              const filtered = filterItemsByRole(section.group.items)
              if (filtered.length === 0) return null
              return (
                <div key={section.group.label}>
                  <h3 className="px-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.group.label}
                  </h3>
                  <div className="space-y-1">
                    {filtered.map(item => renderNavLink(item))}
                  </div>
                </div>
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