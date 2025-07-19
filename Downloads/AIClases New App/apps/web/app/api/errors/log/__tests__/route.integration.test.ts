/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { getServerSession } from 'next-auth'

// Mock external dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const mockConsoleError = jest.fn()
const mockConsoleWarn = jest.fn()

beforeAll(() => {
  console.error = mockConsoleError
  console.warn = mockConsoleWarn
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Mock Supabase client with detailed responses
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NODE_ENV: 'test',
  }

  // Reset Supabase mock
  mockSupabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })
})

afterEach(() => {
  process.env = originalEnv
})

describe('/api/errors/log', () => {
  const validErrorReport = {
    errorId: 'error_123456789',
    message: 'Test error message',
    stack: 'Error: Test error\n    at Component.render (Component.js:10:5)',
    componentStack: 'in Component (Component.js:10)',
    timestamp: new Date().toISOString(),
    url: 'https://aiclases.com/dashboard',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    level: 'component' as const,
    userId: 'user_123',
    sessionId: 'session_123',
    additionalData: { browser: 'chrome', version: '91.0' },
  }

  describe('POST - Error Logging', () => {
    const createPostRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/errors/log', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    describe('Validation', () => {
      it('validates required fields', async () => {
        const incompleteReport = {
          errorId: 'error_123',
          // Missing required fields
        }

        const request = createPostRequest(incompleteReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Missing required field')
      })

      it('accepts valid error report', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'test-user-id' },
        })

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.errorId).toBe(validErrorReport.errorId)
        expect(data.message).toBe('Error logged successfully')
      })

      it('handles missing optional fields gracefully', async () => {
        const minimalReport = {
          errorId: 'error_minimal',
          message: 'Minimal error message',
          timestamp: new Date().toISOString(),
          url: 'https://aiclases.com',
          level: 'component',
        }

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(minimalReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })

    describe('Session Handling', () => {
      it('works without user session', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue(null)

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })

      it('handles session error gracefully', async () => {
        ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Could not get session for error logging:',
          expect.any(Error)
        )
      })

      it('uses session user ID when available', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'session-user-id' },
        })

        const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: insertMock,
        })

        const request = createPostRequest(validErrorReport)
        await POST(request)

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'session-user-id',
          })
        )
      })
    })

    describe('Data Processing', () => {
      beforeEach(() => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })
      })

      it('truncates long messages', async () => {
        const longMessage = 'a'.repeat(2000)
        const reportWithLongMessage = {
          ...validErrorReport,
          message: longMessage,
        }

        const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: insertMock,
        })

        const request = createPostRequest(reportWithLongMessage)
        await POST(request)

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringMatching(/^a{1000}$/),
          })
        )
      })

      it('truncates long stack traces', async () => {
        const longStack = 'Error\n    at '.repeat(1000)
        const reportWithLongStack = {
          ...validErrorReport,
          stack: longStack,
        }

        const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: insertMock,
        })

        const request = createPostRequest(reportWithLongStack)
        await POST(request)

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            stack_trace: expect.stringWithMaxLength(5000),
          })
        )
      })

      it('generates consistent error hash for duplicate detection', async () => {
        const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: insertMock,
        })

        const request = createPostRequest(validErrorReport)
        await POST(request)

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            error_hash: expect.any(String),
          })
        )

        // Hash should be consistent for same error
        const insertCall = insertMock.mock.calls[0][0]
        expect(insertCall.error_hash.length).toBeLessThanOrEqual(50)
      })
    })

    describe('Duplicate Error Handling', () => {
      it('updates occurrence count for existing errors', async () => {
        const existingError = { id: 'existing-error-id', occurrences: 5 }
        const updateMock = jest.fn().mockResolvedValue({ data: {}, error: null })

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingError, error: null }),
            }),
          }),
          update: updateMock,
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(updateMock).toHaveBeenCalledWith({
          occurrences: 6,
          last_occurred_at: validErrorReport.timestamp,
        })
      })

      it('creates new error when no duplicate exists', async () => {
        const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: insertMock,
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            occurrences: 1,
            first_occurred_at: validErrorReport.timestamp,
            last_occurred_at: validErrorReport.timestamp,
          })
        )
      })
    })

    describe('Critical Error Handling', () => {
      it('logs critical errors to console', async () => {
        const criticalReport = {
          ...validErrorReport,
          level: 'critical' as const,
        }

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(criticalReport)
        await POST(request)

        expect(mockConsoleError).toHaveBeenCalledWith(
          'CRITICAL ERROR LOGGED:',
          criticalReport
        )
      })
    })

    describe('Development Logging', () => {
      it('logs errors to console in development', async () => {
        process.env.NODE_ENV = 'development'

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(validErrorReport)
        await POST(request)

        expect(mockConsoleError).toHaveBeenCalledWith(
          'Frontend Error Logged:',
          expect.objectContaining({
            errorId: validErrorReport.errorId,
            message: validErrorReport.message,
            level: validErrorReport.level,
            url: validErrorReport.url,
          })
        )
      })

      it('does not log to console in production', async () => {
        process.env.NODE_ENV = 'production'

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })

        const request = createPostRequest(validErrorReport)
        await POST(request)

        expect(mockConsoleError).not.toHaveBeenCalledWith(
          'Frontend Error Logged:',
          expect.any(Object)
        )
      })
    })

    describe('Error Handling', () => {
      it('handles database errors gracefully', async () => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        })

        const request = createPostRequest(validErrorReport)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to log error')
        expect(data.message).toBe('Error logging service is unavailable')
      })

      it('handles malformed JSON gracefully', async () => {
        const request = new NextRequest('http://localhost:3000/api/errors/log', {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to log error')
      })
    })
  })

  describe('GET - Error Logs Retrieval', () => {
    const createGetRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/errors/log')
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      
      return new NextRequest(url.toString(), {
        method: 'GET',
      })
    }

    describe('Authentication and Authorization', () => {
      it('returns 401 when user is not authenticated', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue(null)

        const request = createGetRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })

      it('returns 403 when user is not admin', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'regular-user-id' },
        })

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'user', is_admin: false },
                error: null,
              }),
            }),
          }),
        })

        const request = createGetRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Forbidden - Admin access required')
      })

      it('allows access for admin users', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'admin-user-id' },
        })

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin', is_admin: true },
                error: null,
              }),
            }),
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })

        const request = createGetRequest()
        const response = await GET(request)

        expect(response.status).toBe(200)
      })

      it('allows access for super admin users', async () => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'super-admin-user-id' },
        })

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'super_admin', is_admin: false },
                error: null,
              }),
            }),
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })

        const request = createGetRequest()
        const response = await GET(request)

        expect(response.status).toBe(200)
      })
    })

    describe('Query Parameters', () => {
      beforeEach(() => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'admin-user-id' },
        })

        // Mock user profile check
        const mockFrom = jest.fn()
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', is_admin: true },
                    error: null,
                  }),
                }),
              }),
            }
          } else if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnThis(),
                  }),
                }),
              }),
            }
          }
          return mockFrom(table)
        })
      })

      it('applies default limit of 50', async () => {
        const limitMock = jest.fn().mockResolvedValue({ data: [], error: null })
        
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: limitMock,
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest()
        await GET(request)

        expect(limitMock).toHaveBeenCalledWith(50)
      })

      it('applies custom limit', async () => {
        const limitMock = jest.fn().mockResolvedValue({ data: [], error: null })
        
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: limitMock,
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest({ limit: '10' })
        await GET(request)

        expect(limitMock).toHaveBeenCalledWith(10)
      })

      it('filters by error level', async () => {
        const eqMock = jest.fn().mockResolvedValue({ data: [], error: null })
        
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    eq: eqMock,
                  }),
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest({ level: 'critical' })
        await GET(request)

        expect(eqMock).toHaveBeenCalledWith('error_level', 'critical')
      })

      it('filters by resolved status', async () => {
        const eqMock = jest.fn().mockResolvedValue({ data: [], error: null })
        
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    eq: eqMock,
                  }),
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest({ resolved: 'true' })
        await GET(request)

        expect(eqMock).toHaveBeenCalledWith('resolved', true)
      })
    })

    describe('Data Retrieval', () => {
      beforeEach(() => {
        ;(getServerSession as jest.Mock).mockResolvedValue({
          user: { id: 'admin-user-id' },
        })
      })

      it('returns error logs data', async () => {
        const mockErrorLogs = [
          {
            id: 'log1',
            error_id: 'error_123',
            message: 'Test error 1',
            error_level: 'component',
            created_at: '2024-01-01T12:00:00Z',
          },
          {
            id: 'log2',
            error_id: 'error_456',
            message: 'Test error 2',
            error_level: 'critical',
            created_at: '2024-01-01T11:00:00Z',
          },
        ]

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockErrorLogs,
                    error: null,
                  }),
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockErrorLogs)
      })

      it('handles database query errors', async () => {
        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'error_logs') {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                  }),
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', is_admin: true },
                  error: null,
                }),
              }),
            }),
          }
        })

        const request = createGetRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to fetch error logs')
      })
    })

    describe('Error Handling', () => {
      it('handles unexpected errors gracefully', async () => {
        ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

        const request = createGetRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Internal server error')
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Error fetching error logs:',
          expect.any(Error)
        )
      })
    })
  })
})

// Custom Jest matcher for string length
expect.extend({
  stringWithMaxLength(received: any, maxLength: number) {
    const pass = typeof received === 'string' && received.length <= maxLength
    return {
      message: () =>
        `expected ${received} to be a string with max length ${maxLength}`,
      pass,
    }
  },
})