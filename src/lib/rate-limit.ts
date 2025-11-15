import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
}

export async function rateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; remaining?: number }> {
  const finalConfig = { ...defaultConfig, ...config }
  
  // Get client identifier (IP address or user ID)
  const clientId = getClientId(req)
  const now = Date.now()
  
  // Clean up expired entries
  cleanupExpiredEntries(now, finalConfig.windowMs)
  
  // Get or create client record
  let clientRecord = store[clientId]
  
  if (!clientRecord || now > clientRecord.resetTime) {
    // Create new record or reset expired one
    clientRecord = {
      count: 0,
      resetTime: now + finalConfig.windowMs
    }
    store[clientId] = clientRecord
  }
  
  // Check if limit exceeded
  if (clientRecord.count >= finalConfig.maxRequests) {
    return { success: false }
  }
  
  // Increment counter
  clientRecord.count++
  
  return { 
    success: true, 
    remaining: finalConfig.maxRequests - clientRecord.count 
  }
}

function getClientId(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // For API routes, we can also use user ID if available
  const userId = req.headers.get('x-user-id')
  
  return userId || ip
}

function cleanupExpiredEntries(now: number, windowMs: number): void {
  const cutoff = now - windowMs
  
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < cutoff) {
      delete store[key]
    }
  })
}

// Specific rate limits for different endpoints
export const rateLimitConfigs = {
  registration: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 registrations per 15 minutes
  },
  checkin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 check-ins per minute
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 admin requests per minute
  }
}
