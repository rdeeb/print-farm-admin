export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { PrinterPlatform, ConnectorAuthType, BambuAccessMode } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { encryptCredentials } from '@/lib/connector-crypto'

const CreateConnectionSchema = z.object({
  platform: z.nativeEnum(PrinterPlatform),
  host: z.string().optional(),
  port: z.number().int().optional(),
  path: z.string().optional(),
  useTls: z.boolean().optional(),
  authType: z.nativeEnum(ConnectorAuthType).optional(),
  accessMode: z.nativeEnum(BambuAccessMode).optional(),
  credentials: z.record(z.unknown()).optional(),
  capabilities: z.record(z.unknown()).optional(),
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    // Verify printer belongs to tenant
    const printer = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!printer) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    const rawConnections = await prisma.printerConnection.findMany({
      where: {
        printerId: params.id,
        tenantId: session.user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map to omit credentialsEncrypted and replace with hasCredentials boolean
    const connections = rawConnections.map(({ credentialsEncrypted, ...rest }) => ({
      ...rest,
      hasCredentials: credentialsEncrypted !== null,
    }))

    return apiSuccess(connections)
  } catch (error) {
    console.error('Error fetching printer connections:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify printer belongs to tenant
    const printer = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!printer) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    const body = await request.json()
    const parsed = CreateConnectionSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ')
      return apiError('VALIDATION_ERROR', message, 400)
    }

    const {
      platform,
      host,
      port,
      path,
      useTls,
      authType,
      accessMode,
      credentials,
      capabilities,
    } = parsed.data

    // Encrypt credentials if provided
    const credentialsEncrypted = credentials ? encryptCredentials(credentials) : null

    const connection = await prisma.printerConnection.create({
      data: {
        tenantId: session.user.tenantId,
        printerId: params.id,
        platform,
        host: host ?? null,
        port: port ?? null,
        path: path ?? null,
        useTls: useTls ?? false,
        authType: authType ?? null,
        accessMode: accessMode ?? null,
        credentialsEncrypted: credentialsEncrypted as any,
        capabilities: capabilities as any,
      },
      select: CONNECTION_SELECT,
    })

    // Omit credentialsEncrypted (excluded by select in production; guard here for test safety)
    const { credentialsEncrypted: _enc, ...connectionData } = connection as typeof connection & { credentialsEncrypted?: unknown }
    return apiSuccess({ ...connectionData, hasCredentials: credentials !== undefined }, 201)
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return apiError(
        'CONFLICT',
        'A connection for this platform already exists on this printer',
        409
      )
    }
    console.error('Error creating printer connection:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
