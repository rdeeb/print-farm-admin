import { formatBytes, formatCurrency, formatDuration, formatDate, formatDateTime } from './utils'

describe('utils', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(25.99)).toBe('$25.99')
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(25.99, 'EUR')).toBe('€25.99')
      expect(formatCurrency(25.99, 'GBP')).toBe('£25.99')
    })

    it('should fall back to USD for invalid currency codes', () => {
      // @ts-ignore
      expect(formatCurrency(25.99, 'INVALID')).toBe('$25.99')
    })
  })

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(120)).toBe('2h')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Use explicit time to avoid timezone issues
      const date = new Date('2024-01-15T12:00:00')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('should handle string dates', () => {
      // Use explicit time to avoid timezone issues
      expect(formatDate('2024-01-15T12:00:00')).toBe('Jan 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toContain('Jan 15, 2024')
      expect(formatted).toContain('10:30')
    })
  })
})