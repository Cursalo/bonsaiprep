/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getServerSession } from 'next-auth'

// Mock external dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock console.error
const originalConsoleError = console.error
const mockConsoleError = jest.fn()

beforeAll(() => {
  console.error = mockConsoleError
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock Supabase client
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
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('/api/credits/transactions', () => {
  const createGetRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/credits/transactions')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    
    return new NextRequest(url.toString(), {
      method: 'GET',
    })
  }

  const mockTransactions = [
    {
      id: 'txn_1',
      user_id: 'user_123',
      type: 'purchase',
      amount: 500,
      description: 'Credit purchase',
      status: 'completed',
      created_at: '2024-01-15T10:00:00Z',
      metadata: { packageId: 'package_basic' },
    },
    {
      id: 'txn_2',
      user_id: 'user_123',
      type: 'spend',
      amount: -50,
      description: 'Mentor chat session',
      status: 'completed',
      created_at: '2024-01-14T09:30:00Z',
      metadata: { sessionId: 'chat_456' },
    },
    {
      id: 'txn_3',
      user_id: 'user_123',
      type: 'award',
      amount: 25,
      description: 'Course completion bonus',
      status: 'completed',
      created_at: '2024-01-13T14:15:00Z',
      metadata: { courseId: 'course_789' },
    },
  ]

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session exists but user ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {}, // No user ID
      })

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Pagination Parameter Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('validates limit parameter is within range', async () => {
      const request = createGetRequest({ limit: '150' }) // Exceeds max of 100
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Limit must be between 1 and 100')
    })

    it('validates limit parameter is not too small', async () => {
      const request = createGetRequest({ limit: '0' }) // Below min of 1
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Limit must be between 1 and 100')
    })

    it('validates offset parameter is non-negative', async () => {
      const request = createGetRequest({ offset: '-10' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Offset must be non-negative')
    })

    it('accepts valid pagination parameters', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      })

      // Mock count query
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'credit_transactions') {
          const queryBuilder = {
            select: jest.fn(),
            eq: jest.fn(),
            order: jest.fn(),
            range: jest.fn(),
          }

          // For the first call (data query)
          queryBuilder.select.mockReturnValue(queryBuilder)
          queryBuilder.eq.mockReturnValue(queryBuilder)
          queryBuilder.order.mockReturnValue(queryBuilder)
          queryBuilder.range.mockResolvedValue({
            data: mockTransactions,
            error: null,
          })

          return queryBuilder
        }
      })

      // Mock the count query separately
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      }))

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValue({
          count: 3,
          error: null,
        }),
      }))

      const request = createGetRequest({ limit: '10', offset: '0' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Transaction Fetching', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('fetches transactions with correct query parameters', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockTransactions,
              error: null,
            }),
          }),
        }),
      })

      const eqMock = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTransactions,
            error: null,
          }),
        }),
      })

      const orderMock = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })

      const rangeMock = jest.fn().mockResolvedValue({
        data: mockTransactions,
        error: null,
      })

      // Mock count query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: selectMock,
      }))

      selectMock.mockReturnValue({
        eq: eqMock,
      })

      eqMock.mockReturnValue({
        order: orderMock,
      })

      orderMock.mockReturnValue({
        range: rangeMock,
      })

      // Mock count query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValue({
          count: 3,
          error: null,
        }),
      }))

      const request = createGetRequest({ limit: '25', offset: '10' })
      await GET(request)

      expect(selectMock).toHaveBeenCalledWith('*')
      expect(eqMock).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(rangeMock).toHaveBeenCalledWith(10, 34) // offset to offset + limit - 1
    })

    it('returns transactions with proper structure', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 3,
            error: null,
          }),
        }))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('transactions')
      expect(data).toHaveProperty('pagination')
      expect(data.transactions).toEqual(mockTransactions)
      expect(data.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 3,
        hasMore: false,
      })
    })

    it('handles database query errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      })

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transactions')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error fetching transactions:',
        expect.objectContaining({ message: 'Database error' })
      )
    })

    it('handles count query errors gracefully', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: null,
            error: { message: 'Count query failed' },
          }),
        }))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.total).toBe(0) // Defaults to 0 on count error
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error fetching transaction count:',
        expect.objectContaining({ message: 'Count query failed' })
      )
    })
  })

  describe('Pagination Logic', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('calculates hasMore correctly when there are more pages', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 100, // More records than current page
            error: null,
          }),
        }))

      const request = createGetRequest({ limit: '10', offset: '0' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination).toEqual({
        limit: 10,
        offset: 0,
        total: 100,
        hasMore: true, // 0 + 10 < 100
      })
    })

    it('calculates hasMore correctly when on last page', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 25,
            error: null,
          }),
        }))

      const request = createGetRequest({ limit: '10', offset: '20' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination).toEqual({
        limit: 10,
        offset: 20,
        total: 25,
        hasMore: false, // 20 + 10 >= 25
      })
    })

    it('uses default pagination values when not provided', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTransactions,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 3,
            error: null,
          }),
        }))

      const request = createGetRequest() // No limit/offset provided
      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination).toEqual({
        limit: 50, // Default limit
        offset: 0,  // Default offset
        total: 3,
        hasMore: false,
      })
    })
  })

  describe('Edge Cases and Performance', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('handles empty transaction list', async () => {
      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        }))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.transactions).toEqual([])
      expect(data.pagination.total).toBe(0)
      expect(data.pagination.hasMore).toBe(false)
    })

    it('handles large offset values correctly', async () => {
      const rangeMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: rangeMock,
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 1000,
            error: null,
          }),
        }))

      const request = createGetRequest({ limit: '25', offset: '975' })
      await GET(request)

      expect(rangeMock).toHaveBeenCalledWith(975, 999) // 975 + 25 - 1
    })

    it('handles maximum limit value', async () => {
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockTransactions,
        error: null,
      })

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: rangeMock,
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 150,
            error: null,
          }),
        }))

      const request = createGetRequest({ limit: '100' }) // Maximum allowed
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(rangeMock).toHaveBeenCalledWith(0, 99) // 0 + 100 - 1
      expect(data.pagination.limit).toBe(100)
    })

    it('handles user with thousands of transactions efficiently', async () => {
      // Simulate a user with many transactions
      const largeTransactionSet = Array.from({ length: 50 }, (_, i) => ({
        id: `txn_${i}`,
        user_id: 'test-user-id',
        type: 'spend',
        amount: -10,
        description: `Transaction ${i}`,
        status: 'completed',
        created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
        metadata: {},
      }))

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: largeTransactionSet,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 5000, // Large number of total transactions
            error: null,
          }),
        }))

      const request = createGetRequest({ limit: '50', offset: '100' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.transactions).toHaveLength(50)
      expect(data.pagination.total).toBe(5000)
      expect(data.pagination.hasMore).toBe(true)
    })

    it('handles non-numeric pagination parameters gracefully', async () => {
      // Mock to avoid actual database calls for invalid params
      const request = createGetRequest({ limit: 'abc', offset: 'xyz' })
      const response = await GET(request)
      const data = await response.json()

      // Should parse as NaN -> 0, which triggers validation errors
      expect(response.status).toBe(400)
      expect(data.error).toBe('Limit must be between 1 and 100')
    })
  })

  describe('Data Integrity and Security', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('only returns transactions for authenticated user', async () => {
      const eqMock = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTransactions,
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: eqMock,
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 3,
            error: null,
          }),
        }))

      const request = createGetRequest()
      await GET(request)

      expect(eqMock).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('returns transactions ordered by creation date (newest first)', async () => {
      const orderMock = jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 3,
            error: null,
          }),
        }))

      const request = createGetRequest()
      await GET(request)

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('includes complete transaction data with metadata', async () => {
      const transactionsWithMetadata = [
        {
          ...mockTransactions[0],
          metadata: {
            packageId: 'package_premium',
            paymentMethod: 'stripe',
            originalAmount: '$10.00',
            currency: 'USD',
          },
        },
      ]

      mockSupabaseClient.from
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: transactionsWithMetadata,
                  error: null,
                }),
              }),
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockResolvedValue({
            count: 1,
            error: null,
          }),
        }))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.transactions[0]).toHaveProperty('metadata')
      expect(data.transactions[0].metadata).toEqual({
        packageId: 'package_premium',
        paymentMethod: 'stripe',
        originalAmount: '$10.00',
        currency: 'USD',
      })
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
        'Transactions API error:',
        expect.any(Error)
      )
    })

    it('handles database connection failures', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})