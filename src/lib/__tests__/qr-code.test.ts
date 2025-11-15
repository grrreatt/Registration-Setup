import { 
  generateQRCode, 
  generateQRCodeSVG, 
  createBadgeQRData, 
  parseBadgeQRData, 
  validateQRCodeData 
} from '../qr-code'

// Mock QRCode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code')),
  toString: jest.fn(() => Promise.resolve('<svg>mock-qr-svg</svg>')),
}))

describe('QR Code Utils', () => {
  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const dataURL = await generateQRCode('test-data')
      expect(dataURL).toBe('data:image/png;base64,mock-qr-code')
    })

    it('should handle custom options', async () => {
      const dataURL = await generateQRCode('test-data', {
        width: 512,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' }
      })
      expect(dataURL).toBe('data:image/png;base64,mock-qr-code')
    })
  })

  describe('generateQRCodeSVG', () => {
    it('should generate QR code SVG', async () => {
      const svg = await generateQRCodeSVG('test-data')
      expect(svg).toBe('<svg>mock-qr-svg</svg>')
    })
  })

  describe('createBadgeQRData', () => {
    it('should create valid badge QR data', () => {
      const badgeUID = 'REG123456789'
      const eventCode = 'EVENT2024'
      const qrData = createBadgeQRData(badgeUID, eventCode)
      
      const parsed = JSON.parse(qrData)
      expect(parsed).toEqual({
        type: 'badge',
        badge_uid: badgeUID,
        event_code: eventCode,
        timestamp: expect.any(Number),
        version: '1.0'
      })
    })

    it('should create QR data without event code', () => {
      const badgeUID = 'REG123456789'
      const qrData = createBadgeQRData(badgeUID)
      
      const parsed = JSON.parse(qrData)
      expect(parsed.badge_uid).toBe(badgeUID)
      expect(parsed.event_code).toBeUndefined()
    })
  })

  describe('parseBadgeQRData', () => {
    it('should parse valid badge QR data', () => {
      const qrData = JSON.stringify({
        type: 'badge',
        badge_uid: 'REG123456789',
        event_code: 'EVENT2024',
        timestamp: Date.now(),
        version: '1.0'
      })
      
      const parsed = parseBadgeQRData(qrData)
      expect(parsed).toEqual({
        type: 'badge',
        badge_uid: 'REG123456789',
        event_code: 'EVENT2024',
        timestamp: expect.any(Number),
        version: '1.0'
      })
    })

    it('should return null for invalid JSON', () => {
      const result = parseBadgeQRData('invalid-json')
      expect(result).toBeNull()
    })

    it('should return null for missing required fields', () => {
      const qrData = JSON.stringify({
        type: 'badge',
        // missing badge_uid
        timestamp: Date.now(),
        version: '1.0'
      })
      
      const result = parseBadgeQRData(qrData)
      expect(result).toBeNull()
    })

    it('should return null for wrong type', () => {
      const qrData = JSON.stringify({
        type: 'other',
        badge_uid: 'REG123456789',
        timestamp: Date.now(),
        version: '1.0'
      })
      
      const result = parseBadgeQRData(qrData)
      expect(result).toBeNull()
    })
  })

  describe('validateQRCodeData', () => {
    it('should validate correct QR code data', () => {
      const qrData = JSON.stringify({
        type: 'badge',
        badge_uid: 'REG123456789',
        event_code: 'EVENT2024',
        timestamp: Date.now(),
        version: '1.0'
      })
      
      expect(validateQRCodeData(qrData)).toBe(true)
    })

    it('should reject invalid QR code data', () => {
      expect(validateQRCodeData('invalid-json')).toBe(false)
      expect(validateQRCodeData('{}')).toBe(false)
      expect(validateQRCodeData('{"type": "other"}')).toBe(false)
    })
  })
})


