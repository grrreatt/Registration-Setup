import { NextRequest } from 'next/server'

interface ValidationResult {
  success: boolean
  error?: string
  status?: number
}

export async function validateRequest(req: NextRequest): Promise<ValidationResult> {
  // Check origin allowlist
  const origin = req.headers.get('origin') || req.headers.get('referer')
  const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  
  if (allowedOrigins.length > 0 && origin) {
    const isAllowed = allowedOrigins.some(allowed => 
      origin.startsWith(allowed) || origin.includes(allowed)
    )
    
    if (!isAllowed) {
      return {
        success: false,
        error: 'Origin not allowed',
        status: 403
      }
    }
  }

  // Check for required headers
  const contentType = req.headers.get('content-type')
  if (req.method === 'POST' && !contentType?.includes('application/json')) {
    return {
      success: false,
      error: 'Content-Type must be application/json',
      status: 400
    }
  }

  // Basic CSRF protection (in production, use proper CSRF tokens)
  const csrfToken = req.headers.get('x-csrf-token')
  if (process.env.NODE_ENV === 'production' && !csrfToken) {
    return {
      success: false,
      error: 'CSRF token required',
      status: 403
    }
  }

  return { success: true }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export function validateBadgeUID(badgeUID: string): boolean {
  const badgeRegex = /^[A-Z0-9]{6,20}$/
  return badgeRegex.test(badgeUID)
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
