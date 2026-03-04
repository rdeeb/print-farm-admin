import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { User, Pencil, Trash2, Mail, Phone, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { sourceConfig } from '../../constants'
import type { Client } from '@/model/client'

interface ClientCardProps {
  client: Client
  canEdit: boolean
  canDelete: boolean
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
}

export function ClientCard({ client, canEdit, canDelete, onEdit, onDelete }: ClientCardProps) {
  const source = sourceConfig[client.source] || sourceConfig.DIRECT
  const hasNoOrders = (client._count?.orders ?? 0) === 0

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(client)}
                aria-label="Edit client"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {canDelete && hasNoOrders && (
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
                        Are you sure you want to delete &quot;{client.name}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(client.id)}
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
}
