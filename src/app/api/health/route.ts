import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('count')
      .limit(1)

    const dbStatus = error ? 'unhealthy' : 'healthy'
    const responseTime = Date.now() - startTime

    const healthStatus = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    }

    if (dbStatus === 'healthy') {
      logger.info('Health check passed', { responseTime })
      return NextResponse.json(healthStatus, { status: 200 })
    } else {
      logger.error('Health check failed - database issue', { error: error?.message })
      return NextResponse.json(healthStatus, { status: 503 })
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    logger.error('Health check failed', { 
      error: error.message,
      responseTime 
    })

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'unhealthy',
          error: error.message
        },
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    }, { status: 503 })
  }
}


