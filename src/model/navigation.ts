import type React from 'react'

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

/** A labeled group of nav items shown together in the sidebar */
export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

/** Section in the sidebar: either a single item or a group */
export type NavigationSection =
  | { type: 'item'; item: NavigationItem }
  | { type: 'group'; group: NavigationGroup }
