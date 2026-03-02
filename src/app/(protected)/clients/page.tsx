'use client'

import { useState, useEffect } from 'react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, Search, User, Pencil, Trash2, Mail, Phone, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PrinterLoaderIcon } from '@/components/ui/printer-loader-icon'
import type { Client } from '@/model/client'

const sourceConfig: Record<string, { label: string; className: string }> = {
  DIRECT: { label: 'Direct', className: 'bg-gray-100 text-gray-800' },
  FACEBOOK: { label: 'Facebook', className: 'bg-blue-100 text-blue-800' },
  INSTAGRAM: { label: 'Instagram', className: 'bg-pink-100 text-pink-800' },
  WEBSITE: { label: 'Website', className: 'bg-green-100 text-green-800' },
  REFERRAL: { label: 'Referral', className: 'bg-purple-100 text-purple-800' },
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'DIRECT',
    address: '',
    notes: '',
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      source: 'DIRECT',
      address: '',
      notes: '',
    })
    setEditingClient(null)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      source: client.source,
      address: client.address || '',
      notes: client.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingClient) {
        // Update existing client
        const response = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const updatedClient = await response.json()
          setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c))
          setIsDialogOpen(false)
          resetForm()
        }
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const newClient = await response.json()
          setClients([newClient, ...clients])
          setIsDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleDelete = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setClients(clients.filter(c => c.id !== clientId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)

    const matchesSource = !filterSource || client.source === filterSource

    return matchesSearch && matchesSource
  })

  const canEdit = session?.user?.role !== 'VIEWER'
  const canDelete = session?.user?.role === 'ADMIN'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <PrinterLoaderIcon size={64} color="#4f46e5" />
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your client database
          </p>
        </div>

        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Create New Client'}</DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Update client information' : 'Add a new client to your database'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Client name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Client address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingClient ? 'Update Client' : 'Create Client'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterSource || 'all'} onValueChange={(v) => setFilterSource(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="DIRECT">Direct</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const source = sourceConfig[client.source] || sourceConfig.DIRECT

          return (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${source.className}`}>
                        {source.label}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete && (client._count?.orders ?? 0) === 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{client.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(client.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {client.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.phone}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {client._count?.orders ?? 0} order{(client._count?.orders ?? 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Added {client.createdAt ? formatDate(client.createdAt) : '—'}
                </p>
              </CardContent>
            </Card>
          )
        })}

        {filteredClients.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 text-center mb-4">
                {clients.length === 0
                  ? "You haven't added any clients yet."
                  : "No clients match your current filters."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
