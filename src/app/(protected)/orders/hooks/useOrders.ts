'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Order } from '@/model/order'
import type { Client } from '@/model/client'
import type { Project } from '@/model/project'

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = new Date(dueDate)
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

export interface OrderFormData {
  projectId: string
  quantity: string
  priority: string
  dueDate: string
  clientId: string
  notes: string
}

export interface ClientFormData {
  name: string
  phone: string
  email: string
  source: string
}

const initialOrderForm: OrderFormData = {
  projectId: '',
  quantity: '1',
  priority: 'MEDIUM',
  dueDate: '',
  clientId: '',
  notes: '',
}

const initialClientForm: ClientFormData = {
  name: '',
  phone: '',
  email: '',
  source: 'DIRECT',
}

export function useOrders() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('createdAt-desc')
  const [quickFilter, setQuickFilter] = useState<string>('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    if (typeof window === 'undefined') return 'list'
    return sessionStorage.getItem('ordersViewMode') === 'board' ? 'board' : 'list'
  })
  const [formData, setFormData] = useState<OrderFormData>(initialOrderForm)
  const [clientFormData, setClientFormData] = useState<ClientFormData>(initialClientForm)
  const [isSuggestingDate, setIsSuggestingDate] = useState(false)

  const hasAppliedUrlSync = useRef(false)

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (filterStatus) params.set('status', filterStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (sortOrder && sortOrder !== 'createdAt-desc') params.set('sort', sortOrder)
    if (viewMode === 'board') params.set('view', 'board')
    if (quickFilter) params.set('filter', quickFilter)
    const qs = params.toString()
    router.replace(qs ? `/orders?${qs}` : '/orders', { scroll: false })
  }, [searchTerm, filterStatus, filterPriority, sortOrder, viewMode, quickFilter, router])

  useEffect(() => {
    const status = searchParams.get('status') ?? ''
    const priority = searchParams.get('priority') ?? ''
    const sort = searchParams.get('sort') ?? 'createdAt-desc'
    const viewParam = searchParams.get('view')
    const view =
      viewParam === 'board' || viewParam === 'list'
        ? viewParam
        : typeof window !== 'undefined'
          ? (sessionStorage.getItem('ordersViewMode') === 'board' ? 'board' : 'list')
          : 'list'
    const search = searchParams.get('search') ?? ''
    const filter = searchParams.get('filter') ?? ''

    setFilterStatus(status)
    setFilterPriority(priority)
    setSortOrder(sort)
    setViewMode(view)
    setSearchTerm(search)
    setQuickFilter(filter === 'due-today' || filter === 'need-action' ? filter : '')
  }, [searchParams])

  useEffect(() => {
    sessionStorage.setItem('ordersViewMode', viewMode)
    if (!hasAppliedUrlSync.current) {
      hasAppliedUrlSync.current = true
      return
    }
    updateUrl()
  }, [viewMode, searchTerm, filterStatus, filterPriority, sortOrder, quickFilter, updateUrl])

  const suggestDueDate = useCallback(async (projectId: string, quantity: string) => {
    if (!projectId || !quantity || parseInt(quantity) <= 0) return

    setIsSuggestingDate(true)
    try {
      const response = await fetch(
        `/api/production/suggest-due-date?projectId=${projectId}&quantity=${quantity}`
      )
      if (response.ok) {
        const data = await response.json()
        const date = new Date(data.suggestedDueDate)
        setFormData((prev) => ({
          ...prev,
          dueDate: date.toISOString().split('T')[0],
        }))
      }
    } catch (error) {
      console.error('Error suggesting due date:', error)
    } finally {
      setIsSuggestingDate(false)
    }
  }, [])

  useEffect(() => {
    if (formData.projectId && formData.quantity) {
      const timer = setTimeout(() => {
        suggestDueDate(formData.projectId, formData.quantity)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.projectId, formData.quantity, suggestDueDate])

  const fetchClients = useCallback(async (search?: string) => {
    try {
      const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, projectsRes, clientsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/projects'),
          fetch('/api/clients'),
        ])

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData)
        }
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData)
        }
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Fire-and-forget overdue check — triggers notifications without blocking the UI
    fetch('/api/notifications/check-overdue', { method: 'POST' }).catch(() => {
      // Intentionally silent — this is a background operation
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearchTerm) {
        fetchClients(clientSearchTerm)
      } else {
        fetchClients()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [clientSearchTerm, fetchClients])

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientFormData),
        })

        if (response.ok) {
          const newClient = await response.json()
          setClients([newClient, ...clients])
          setFormData({ ...formData, clientId: newClient.id })
          setIsClientDialogOpen(false)
          setClientFormData(initialClientForm)
        }
      } catch (error) {
        console.error('Error creating client:', error)
      }
    },
    [clientFormData, clients, formData]
  )

  const handleCreateOrder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            quantity: parseInt(formData.quantity),
            dueDate: formData.dueDate || undefined,
          }),
        })

        if (response.ok) {
          const newOrder = await response.json()
          setOrders([newOrder, ...orders])
          setIsDialogOpen(false)
          setFormData(initialOrderForm)
        }
      } catch (error) {
        console.error('Error creating order:', error)
      }
    },
    [formData, orders]
  )

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.project.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filterStatus || order.status === filterStatus
      const matchesPriority = !filterPriority || order.priority === filterPriority
      const matchesDueToday = quickFilter !== 'due-today' || isDueToday(order.dueDate)
      const matchesNeedAction =
        quickFilter !== 'need-action' ||
        order.status === 'PENDING' ||
        (order.dueDate != null && new Date(order.dueDate) < new Date())

      return matchesSearch && matchesStatus && matchesPriority && matchesDueToday && matchesNeedAction
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'createdAt-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'createdAt-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'dueDate-asc':
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'dueDate-desc':
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        default:
          return 0
      }
    })

  const selectedClient = clients.find((c) => c.id === formData.clientId)

  return {
    orders,
    projects,
    clients,
    isLoading,
    isDialogOpen,
    isClientDialogOpen,
    searchTerm,
    filterStatus,
    filterPriority,
    sortOrder,
    quickFilter,
    clientSearchTerm,
    viewMode,
    formData,
    clientFormData,
    filteredOrders,
    selectedClient,
    isSuggestingDate,
    setOrders,
    setIsDialogOpen,
    setIsClientDialogOpen,
    setSearchTerm,
    setFilterStatus,
    setFilterPriority,
    setSortOrder,
    setQuickFilter,
    setClientSearchTerm,
    setViewMode,
    setFormData,
    setClientFormData,
    handleCreateOrder,
    handleCreateClient,
  }
}
