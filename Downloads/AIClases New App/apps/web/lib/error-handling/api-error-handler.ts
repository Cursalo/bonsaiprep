import { NextResponse } from 'next/server'

// Enhanced error types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field?: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 503, 'EXTERNAL_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}

// API Error Response Handler
export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle known API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        },
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    )
  }

  // Handle validation errors from Zod or similar
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: error,
        },
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return NextResponse.json(
      {
        error: {
          message: 'External service unavailable',
          code: 'SERVICE_UNAVAILABLE',
          statusCode: 503,
        },
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  // Handle generic errors
  const genericError = error as Error
  return NextResponse.json(
    {
      error: {
        message: process.env.NODE_ENV === 'development' 
          ? genericError.message || 'Internal server error'
          : 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        stack: process.env.NODE_ENV === 'development' ? genericError.stack : undefined,
      },
      success: false,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

// Client-side error handler for fetch requests
export interface ClientAPIError {
  message: string
  code?: string
  statusCode: number
  details?: Record<string, any>
}

export class ClientAPIException extends Error {
  constructor(
    public error: ClientAPIError,
    public response?: Response
  ) {
    super(error.message)
    this.name = 'ClientAPIException'
  }
}

// Enhanced fetch wrapper with error handling
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    const isJSON = contentType?.includes('application/json')

    if (!response.ok) {
      let errorData: any = {}
      
      if (isJSON) {
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }
      } else {
        errorData = { message: response.statusText }
      }

      const apiError: ClientAPIError = {
        message: errorData.error?.message || errorData.message || `HTTP ${response.status}`,
        code: errorData.error?.code || 'HTTP_ERROR',
        statusCode: response.status,
        details: errorData.error?.details || errorData,
      }

      throw new ClientAPIException(apiError, response)
    }

    if (isJSON) {
      return await response.json()
    } else {
      return response.text() as unknown as T
    }
  } catch (error) {
    // Re-throw ClientAPIException as-is
    if (error instanceof ClientAPIException) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ClientAPIException({
        message: 'Network error: Unable to connect to server',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      })
    }

    // Handle timeout errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ClientAPIException({
        message: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        statusCode: 408,
      })
    }

    // Handle unknown errors
    const unknownError = error as Error
    throw new ClientAPIException({
      message: unknownError.message || 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    })
  }
}

// Retry wrapper for API requests
export async function apiRequestWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: ClientAPIException | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(url, options)
    } catch (error) {
      lastError = error as ClientAPIException
      
      // Don't retry on client errors (4xx) except timeout
      if (lastError.error.statusCode >= 400 && lastError.error.statusCode < 500) {
        if (lastError.error.statusCode !== 408) {
          throw lastError
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
      )
    }
  }

  throw lastError!
}

// Hook for handling API errors in React components
export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientAPIException) {
    return error.error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

// User-friendly error messages in Spanish
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT_ERROR: 'La solicitud tardó demasiado. Intenta nuevamente.',
  AUTHENTICATION_ERROR: 'Debes iniciar sesión para continuar.',
  AUTHORIZATION_ERROR: 'No tienes permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  NOT_FOUND_ERROR: 'El recurso solicitado no fue encontrado.',
  RATE_LIMIT_ERROR: 'Has hecho demasiadas solicitudes. Espera un momento.',
  DATABASE_ERROR: 'Error en la base de datos. Intenta nuevamente.',
  EXTERNAL_SERVICE_ERROR: 'Servicio externo no disponible. Intenta más tarde.',
  PAYMENT_ERROR: 'Error en el procesamiento del pago.',
  UPLOAD_ERROR: 'Error al subir el archivo.',
  INTERNAL_ERROR: 'Error interno del servidor.',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado.',
} as const

export function getLocalizedErrorMessage(code?: string): string {
  if (!code) return ERROR_MESSAGES.UNKNOWN_ERROR
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR
}

// Error boundary error handler
export function logErrorToBoundary(error: Error, errorInfo?: any) {
  console.error('Error Boundary caught error:', error, errorInfo)
  
  // Send to error logging service
  if (typeof window !== 'undefined') {
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: window.navigator.userAgent,
        level: 'component',
      }),
    }).catch(() => {
      // Silently fail if error logging fails
    })
  }
}

// Validation helper
export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string
): T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value
}

export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email')
  }
  return email
}

export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): string {
  if (min && value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters`,
      fieldName
    )
  }
  if (max && value.length > max) {
    throw new ValidationError(
      `${fieldName} must not exceed ${max} characters`,
      fieldName
    )
  }
  return value
}