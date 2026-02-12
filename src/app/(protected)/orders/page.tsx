'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, User, UserPlus, Package, LayoutList, Columns3 } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  _count?: {
    orders: number
  }
}

interface Order {
  id: string
  orderNumber: string
  quantity: number
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING' | 'ASSEMBLED' | 'DELIVERED' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
    source: string
  }
  partsTotal: number
  partsPrinted: number
  notes: string | null
  project: {
    id: string
    name: string
  }
  createdAt: string
}

interface Project {
  id: string
  name: string
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' as const, icon: Clock },
  WAITING: { label: 'Ready for Assembly', variant: 'default' as const, icon: Package },
  ASSEMBLED: { label: 'Assembled', variant: 'default' as const, icon: CheckCircle },
  DELIVERED: { label: 'Delivered', variant: 'success' as const, icon: CheckCircle },
  COMPLETED: { label: 'Delivered', variant: 'success' as const, icon: CheckCircle },
  ON_HOLD: { label: 'On Hold', variant: 'warning' as const, icon: Clock },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
}

const priorityConfig = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
}

const fallbackStatus = { label: 'Unknown', variant: 'secondary' as const, icon: Clock }

// Board columns configuration - defines the workflow stages shown in board view
const boardColumns = [
  { status: 'PENDING' as const, label: 'Pending', color: 'bg-gray-100 border-gray-300' },
  { status: 'IN_PROGRESS' as const, label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { status: 'WAITING' as const, label: 'Ready for Assembly', color: 'bg-orange-50 border-orange-300' },
  { status: 'ASSEMBLED' as const, label: 'Assembled', color: 'bg-purple-50 border-purple-300' },
  { status: 'DELIVERED' as const, label: 'Delivered', color: 'bg-green-50 border-green-300' },
]

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = new Date(dueDate)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

export default function OrdersPage() {
  const { data: session } = useSession()
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
  const [quickFilter, setQuickFilter] = useState<string>('') // 'due-today' | 'need-action' | ''
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  // Default to session-stored view when no view is in the query string
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    if (typeof window === 'undefined') return 'list'
    return sessionStorage.getItem('ordersViewMode') === 'board' ? 'board' : 'list'
  })

  // Initialize state from URL on mount and when URL changes (e.g. back/forward)
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

  // Push filter state to URL when user changes filters (skip first run so we don't overwrite incoming URL params)
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
    sessionStorage.setItem('ordersViewMode', viewMode)
    if (!hasAppliedUrlSync.current) {
      hasAppliedUrlSync.current = true
      return
    }
    updateUrl()
  }, [viewMode, searchTerm, filterStatus, filterPriority, sortOrder, quickFilter, updateUrl])

  const [formData, setFormData] = useState({
    projectId: '',
    quantity: '1',
    priority: 'MEDIUM',
    dueDate: '',
    clientId: '',
    notes: '',
  })
  const [isSuggestingDate, setIsSuggestingDate] = useState(false)

  const suggestDueDate = useCallback(async (projectId: string, quantity: string) => {
    if (!projectId || !quantity || parseInt(quantity) <= 0) return

    setIsSuggestingDate(true)
    try {
      const response = await fetch(`/api/production/suggest-due-date?projectId=${projectId}&quantity=${quantity}`)
      if (response.ok) {
        const data = await response.json()
        const date = new Date(data.suggestedDueDate)
        setFormData(prev => ({
          ...prev,
          dueDate: date.toISOString().split('T')[0]
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

  const [clientFormData, setClientFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'DIRECT',
  })

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
  }, [])

  // Debounced client search
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

  const handleCreateClient = async (e: React.FormEvent) => {
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
        setClientFormData({
          name: '',
          phone: '',
          email: '',
          source: 'DIRECT',
        })
      }
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        setFormData({
          projectId: '',
          quantity: '',
          priority: 'MEDIUM',
          dueDate: '',
          clientId: '',
          notes: '',
        })
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = !searchTerm ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.project.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filterStatus || order.status === filterStatus
      const matchesPriority = !filterPriority || order.priority === filterPriority

      // Dashboard quick filters from URL
      const matchesDueToday = quickFilter !== 'due-today' || isDueToday(order.dueDate)
      const matchesNeedAction = quickFilter !== 'need-action' || order.status === 'PENDING' || (order.dueDate != null && new Date(order.dueDate) < new Date())

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

  const selectedClient = clients.find(c => c.id === formData.clientId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage client orders and track progress
          </p>
        </div>

        {session?.user?.role !== 'VIEWER' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Add a new client order to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Client</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsClientDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      New Client
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Search clients..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="mb-2"
                    />

                    {selectedClient ? (
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{selectedClient.name}</p>
                              <p className="text-sm text-gray-500">
                                {selectedClient.email || selectedClient.phone || 'No contact info'}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ ...formData, clientId: '' })}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                        {clients.length > 0 ? (
                          clients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setFormData({ ...formData, clientId: client.id })
                                setClientSearchTerm('')
                              }}
                            >
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-gray-500">
                                {client.email || client.phone || 'No contact info'}
                                {client._count?.orders !== undefined && ` - ${client._count.orders} orders`}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No clients found. Create one first.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this order"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.clientId || !formData.projectId}>
                    Create Order
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* New Client Dialog */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Name</Label>
              <Input
                id="clientName"
                value={clientFormData.name}
                onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                placeholder="Client name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSource">Source</Label>
              <Select
                value={clientFormData.source}
                onValueChange={(value) => setClientFormData({ ...clientFormData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {quickFilter && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Showing:</span>
              <Badge variant="secondary" className="gap-1">
                {quickFilter === 'due-today' ? 'Due today' : 'Need action'}
                <button
                  type="button"
                  onClick={() => setQuickFilter('')}
                  className="ml-1 rounded hover:bg-gray-300 px-1"
                  aria-label="Clear filter"
                >
                  ×
                </button>
              </Badge>
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING">Ready for Assembly</SelectItem>
                <SelectItem value="ASSEMBLED">Assembled</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority || 'all'} onValueChange={(v) => setFilterPriority(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="dueDate-asc">Due Soonest</SelectItem>
                <SelectItem value="dueDate-desc">Due Furthest</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="rounded-l-none"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] ?? fallbackStatus
            const priority = priorityConfig[order.priority]
            const StatusIcon = status.icon

            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <Link href={`/orders/${order.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge variant={status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.className}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.project.name} - {order.client.name}
                          </p>
                          {order.client.phone && (
                            <p className="text-xs text-gray-500">{order.client.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {order.partsPrinted} / {order.partsTotal} parts printed
                        </p>
                        {order.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {formatDateUTC(order.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {orders.length === 0
                    ? "You haven't created any orders yet."
                    : "No orders match your current filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Orders - Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-5 gap-4 min-w-0">
          {boardColumns.map((column) => {
            const columnOrders = filteredOrders.filter(order => order.status === column.status)

            return (
              <div
                key={column.status}
                className={`min-w-0 rounded-lg border-2 ${column.color}`}
              >
                {/* Column Header */}
                <div className="p-3 border-b bg-white/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-2 space-y-3 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  {columnOrders.map((order) => {
                    const priority = priorityConfig[order.priority]
                    const isOverdue = order.dueDate && new Date(order.dueDate) < new Date()

                    return (
                      <Link key={order.id} href={`/orders/${order.id}`} className="block">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white mx-1 my-1">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{order.orderNumber}</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priority.className}`}>
                                  {priority.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{order.project.name}</p>
                              <p className="text-xs text-gray-500 truncate">{order.client.name}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {order.partsPrinted}/{order.partsTotal} parts
                                </span>
                                {order.dueDate && (
                                  <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                    {formatDateUTC(order.dueDate)}
                                  </span>
                                )}
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${order.partsTotal > 0 ? (order.partsPrinted / order.partsTotal) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}

                  {columnOrders.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
