import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { ConnectorAuthType, BambuAccessMode } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { encryptCredentials } from '@/lib/connector-crypto'

const PatchConnectionSchema = z.object({
  host: z.string().optional(),
  port: z.number().int().optional(),
  path: z.string().optional(),
  useTls: z.boolean().optional(),
  authType: z.nativeEnum(ConnectorAuthType).optional(),
  accessMode: z.nativeEnum(BambuAccessMode).optional(),
  credentials: z.record(z.unknown()).optional(),
  capabilities: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
})

const CONNECTION_SELECT = {
  id: true,
  tenantId: true,
  printerId: true,
  platform: true,
  host: true,
  port: true,
  path: true,
  useTls: true,
  authType: true,
  accessMode: true,
  capabilities: true,
  isEnabled: true,
  lastValidatedAt: true,
  createdAt: true,
  updatedAt: true,
  // credentialsEncrypted is intentionally excluded
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const raw = await prisma.printerConnection.findFirst({
      where: {
        id: params.connectionId,
        printerId: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!raw) {
      return apiError('NOT_FOUND', 'Printer connection not found', 404)
    }

    // Omit credentialsEncrypted, expose hasCredentials boolean instead
    const { credentialsEncrypted, ...connection } = raw
    return apiSuccess({ ...connection, hasCredentials: credentialsEncrypted !== null })
  } catch (error) {
    console.error('Error fetching printer connection:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const existing = await prisma.printerConnection.findFirst({
      where: {
        id: params.connectionId,
        printerId: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Printer connection not found', 404)
    }

    const body = await request.json()
    const parsed = PatchConnectionSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ')
      return apiError('VALIDATION_ERROR', message, 400)
    }

    const {
      host,
      port,
      path,
      useTls,
      authType,
      accessMode,
      credentials,
      capabilities,
      isEnabled,
    } = parsed.data

    // Re-encrypt credentials if provided
    const newCredentialsEncrypted =
      credentials !== undefined ? encryptCredentials(credentials) : undefined

    const connection = await prisma.printerConnection.update({
      where: { id: params.connectionId, tenantId: session.user.tenantId },
      data: {
        ...(host !== undefined && { host }),
        ...(port !== undefined && { port }),
        ...(path !== undefined && { path }),
        ...(useTls !== undefined && { useTls }),
        ...(authType !== undefined && { authType }),
        ...(accessMode !== undefined && { accessMode }),
        ...(newCredentialsEncrypted !== undefined && {
          credentialsEncrypted: newCredentialsEncrypted as any,
        }),
        ...(capabilities !== undefined && { capabilities: capabilities as any }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
      select: CONNECTION_SELECT,
    })

    // Omit credentialsEncrypted (excluded by select in production; guard here for test safety)
    const { credentialsEncrypted: _enc, ...connectionData } = connection as typeof connection & { credentialsEncrypted?: unknown }
    // hasCredentials: true if we just set new creds, or if existing had creds and none were cleared
    const hadCredentials = existing.credentialsEncrypted !== null
    return apiSuccess({ ...connectionData, hasCredentials: newCredentialsEncrypted !== undefined ? true : hadCredentials })
  } catch (error) {
    console.error('Error updating printer connection:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const existing = await prisma.printerConnection.findFirst({
      where: {
        id: params.connectionId,
        printerId: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Printer connection not found', 404)
    }

    await prisma.printerConnection.delete({
      where: { id: params.connectionId },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting printer connection:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
