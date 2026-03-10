import { createNotification } from './notifications'

const mockFindMany = jest.fn()
const mockCreate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('creates a notification when no recent duplicate exists', async () => {
      mockFindMany.mockResolvedValue([])
      mockCreate.mockResolvedValue({
        id: 'notif-1',
        tenantId: 'tenant-1',
        type: 'FILAMENT_LOW',
        title: 'Filament low',
        message: 'Spool X is below 20%',
        data: null,
        read: false,
        userId: null,
        createdAt: new Date(),
      })

      const result = await createNotification({
        tenantId: 'tenant-1',
        type: 'FILAMENT_LOW',
        message: 'Spool X is below 20%',
      })

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          type: 'FILAMENT_LOW',
          createdAt: { gte: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          type: 'FILAMENT_LOW',
          title: 'Filament low',
          message: 'Spool X is below 20%',
          data: undefined,
          userId: null,
        },
      })
      expect(result.id).toBe('notif-1')
      expect(result.type).toBe('FILAMENT_LOW')
    })

    it('uses custom title when provided', async () => {
      mockFindMany.mockResolvedValue([])
      mockCreate.mockResolvedValue({
        id: 'notif-2',
        tenantId: 'tenant-1',
        type: 'JOB_FAILED',
        title: 'Custom title',
        message: 'Job 123 failed',
        data: null,
        read: false,
        userId: null,
        createdAt: new Date(),
      })

      await createNotification({
        tenantId: 'tenant-1',
        type: 'JOB_FAILED',
        message: 'Job 123 failed',
        title: 'Custom title',
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Custom title',
          message: 'Job 123 failed',
        }),
      })
    })

    it('returns existing notification when duplicate within window (deduplication)', async () => {
      const existing = {
        id: 'existing-1',
        tenantId: 'tenant-1',
        type: 'FILAMENT_LOW',
        title: 'Filament low',
        message: 'Spool Y low',
        data: null,
        read: false,
        userId: null,
        createdAt: new Date(),
      }
      mockFindMany.mockResolvedValue([existing])

      const result = await createNotification({
        tenantId: 'tenant-1',
        type: 'FILAMENT_LOW',
        message: 'Spool Y low',
      })

      expect(mockCreate).not.toHaveBeenCalled()
      expect(result).toEqual(existing)
    })

    it('includes metadata and dedupeKey in data when provided', async () => {
      mockFindMany.mockResolvedValue([])
      mockCreate.mockResolvedValue({
        id: 'notif-3',
        tenantId: 'tenant-1',
        type: 'ORDER_OVERDUE',
        title: 'Order overdue',
        message: 'Order ORD-001 is overdue',
        data: { orderId: 'ord-1', dedupeKey: 'ord-1' },
        read: false,
        userId: null,
        createdAt: new Date(),
      })

      await createNotification({
        tenantId: 'tenant-1',
        type: 'ORDER_OVERDUE',
        message: 'Order ORD-001 is overdue',
        metadata: { orderId: 'ord-1' },
        dedupeKey: 'ord-1',
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: { orderId: 'ord-1', dedupeKey: 'ord-1' },
        }),
      })
    })
  })
})
