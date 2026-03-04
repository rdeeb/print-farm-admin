'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Client } from '@/model/client'

export interface ClientFormData {
  name: string
  phone: string
  email: string
  source: string
  address: string
  notes: string
}

const initialFormData: ClientFormData = {
  name: '',
  phone: '',
  email: '',
  source: 'DIRECT',
  address: '',
  notes: '',
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [formData, setFormData] = useState<ClientFormData>(initialFormData)

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

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setEditingClient(null)
  }, [])

  const openEditDialog = useCallback((client: Client) => {
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
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        if (editingClient) {
          const response = await fetch(`/api/clients/${editingClient.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })

          if (response.ok) {
            const updatedClient = await response.json()
            setClients(clients.map((c) => (c.id === editingClient.id ? updatedClient : c)))
            setIsDialogOpen(false)
            resetForm()
          }
        } else {
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
    },
    [editingClient, formData, clients, resetForm]
  )

  const handleDelete = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setClients((prev) => prev.filter((c) => c.id !== clientId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)

    const matchesSource = !filterSource || client.source === filterSource

    return matchesSearch && matchesSource
  })

  return {
    clients,
    filteredClients,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingClient,
    searchTerm,
    setSearchTerm,
    filterSource,
    setFilterSource,
    formData,
    setFormData,
    resetForm,
    openEditDialog,
    handleSubmit,
    handleDelete,
  }
}
