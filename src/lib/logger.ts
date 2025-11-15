interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: any
  userId?: string
  sessionId?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatLog(level: string, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? JSON.stringify(context, null, 2) : undefined,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      requestId: this.getCurrentRequestId(),
    }
  }

  private getCurrentUserId(): string | undefined {
    // In a real app, this would come from authentication context
    return undefined
  }

  private getCurrentSessionId(): string | undefined {
    // In a real app, this would come from session management
    return undefined
  }

  private getCurrentRequestId(): string | undefined {
    // In a real app, this would come from request context
    return undefined
  }

  private shouldLog(level: string): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log errors and warnings by default
    if (this.isProduction) {
      return level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN
    }
    
    return true
  }

  private output(level: string, message: string, context?: any): void {
    if (!this.shouldLog(level)) return

    const logEntry = this.formatLog(level, message, context)

    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        [LOG_LEVELS.ERROR]: '❌',
        [LOG_LEVELS.WARN]: '⚠️',
        [LOG_LEVELS.INFO]: 'ℹ️',
        [LOG_LEVELS.DEBUG]: '🐛'
      }[level] || '📝'

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`)
      if (context) {
        console.log('Context:', context)
      }
    } else {
      // Structured logging in production
      console.log(JSON.stringify(logEntry))
    }

    // In production, you might want to send logs to external services
    if (this.isProduction && level === LOG_LEVELS.ERROR) {
      this.sendToExternalService(logEntry)
    }
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    // Example: Send to external logging service
    // await fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // })
  }

  error(message: string, context?: any): void {
    this.output(LOG_LEVELS.ERROR, message, context)
  }

  warn(message: string, context?: any): void {
    this.output(LOG_LEVELS.WARN, message, context)
  }

  info(message: string, context?: any): void {
    this.output(LOG_LEVELS.INFO, message, context)
  }

  debug(message: string, context?: any): void {
    this.output(LOG_LEVELS.DEBUG, message, context)
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, context?: any): void {
    this.info(`API Request: ${method} ${url}`, context)
  }

  apiResponse(method: string, url: string, status: number, context?: any): void {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO
    this.output(level, `API Response: ${method} ${url} - ${status}`, context)
  }

  userAction(action: string, userId?: string, context?: any): void {
    this.info(`User Action: ${action}`, { userId, ...context })
  }

  securityEvent(event: string, context?: any): void {
    this.warn(`Security Event: ${event}`, context)
  }

  performance(operation: string, duration: number, context?: any): void {
    this.info(`Performance: ${operation} took ${duration}ms`, context)
  }
}

export const logger = new Logger()

// Error handling utilities
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: any

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export function handleError(error: unknown, context?: any): AppError {
  if (error instanceof AppError) {
    logger.error(`Operational Error: ${error.message}`, {
      statusCode: error.statusCode,
      context: error.context,
      ...context
    })
    return error
  }

  if (error instanceof Error) {
    logger.error(`Unexpected Error: ${error.message}`, {
      stack: error.stack,
      ...context
    })
    return new AppError(
      'An unexpected error occurred',
      500,
      false,
      { originalError: error.message, ...context }
    )
  }

  logger.error('Unknown Error', { error, ...context })
  return new AppError(
    'An unknown error occurred',
    500,
    false,
    { originalError: error, ...context }
  )
}

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start
      logger.performance(operation, duration)
    })
  } else {
    const duration = performance.now() - start
    logger.performance(operation, duration)
    return result
  }
}

