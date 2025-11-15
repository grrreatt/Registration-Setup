import { generateBadgeUID, formatDate, formatDateTime } from '../utils'

describe('Utils', () => {
  describe('generateBadgeUID', () => {
    it('should generate a unique badge UID', () => {
      const uid1 = generateBadgeUID()
      const uid2 = generateBadgeUID()
      
      expect(uid1).toMatch(/^REG[A-Z0-9]+$/)
      expect(uid2).toMatch(/^REG[A-Z0-9]+$/)
      expect(uid1).not.toBe(uid2)
    })

    it('should generate UIDs with consistent format', () => {
      const uid = generateBadgeUID()
      expect(uid).toMatch(/^REG[A-Z0-9]{11,17}$/) // REG + timestamp + random
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-01-15'
      const formatted = formatDate(dateString)
      expect(formatted).toBe('January 15, 2024')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toBe('January 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const formatted = formatDateTime(dateString)
      expect(formatted).toMatch(/Jan 15, 2024, \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should format Date object with time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/Jan 15, 2024, \d{1,2}:\d{2} (AM|PM)/)
    })
  })
})


