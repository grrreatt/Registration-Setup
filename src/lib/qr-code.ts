import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export async function generateQRCode(
  data: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const,
    ...options
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions)
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeSVG(
  data: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const,
    ...options
  }

  try {
    const qrCodeSVG = await QRCode.toString(data, {
      type: 'svg',
      ...defaultOptions
    })
    return qrCodeSVG
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}

export function createBadgeQRData(badgeUID: string, eventCode?: string): string {
  const qrData = {
    type: 'badge',
    badge_uid: badgeUID,
    event_code: eventCode,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  return JSON.stringify(qrData)
}

export function parseBadgeQRData(qrData: string): {
  type: string
  badge_uid: string
  event_code?: string
  timestamp: number
  version: string
} | null {
  try {
    const parsed = JSON.parse(qrData)
    
    // Validate required fields
    if (parsed.type !== 'badge' || !parsed.badge_uid) {
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Error parsing QR code data:', error)
    return null
  }
}

export function validateQRCodeData(qrData: string): boolean {
  const parsed = parseBadgeQRData(qrData)
  return parsed !== null
}
