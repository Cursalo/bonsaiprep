/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
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
  rpc: jest.fn(),
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

describe('/api/credits/spend', () => {
  const createPostRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/credits/spend', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const validSpendRequest = {
    amount: 10,
    transaction_type: 'mentor_chat',
    reference_id: 'chat_session_123',
    metadata: {
      chat_duration: 300,
      messages_count: 5,
    },
  }

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session exists but user ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {}, // No user ID
      })

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('validates amount is provided', async () => {
      const requestWithoutAmount = {
        ...validSpendRequest,
        amount: undefined,
      }

      const request = createPostRequest(requestWithoutAmount)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('validates amount is positive', async () => {
      const requestWithNegativeAmount = {
        ...validSpendRequest,
        amount: -5,
      }

      const request = createPostRequest(requestWithNegativeAmount)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('validates amount is greater than zero', async () => {
      const requestWithZeroAmount = {
        ...validSpendRequest,
        amount: 0,
      }

      const request = createPostRequest(requestWithZeroAmount)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('validates transaction type is provided', async () => {
      const requestWithoutTransactionType = {
        ...validSpendRequest,
        transaction_type: undefined,
      }

      const request = createPostRequest(requestWithoutTransactionType)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Transaction type is required')
    })

    it('validates transaction type is not empty', async () => {
      const requestWithEmptyTransactionType = {
        ...validSpendRequest,
        transaction_type: '',
      }

      const request = createPostRequest(requestWithEmptyTransactionType)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Transaction type is required')
    })
  })

  describe('Balance Checking', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('checks user balance before spending', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_balance: 100 },
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: selectMock,
        }
      })

      const request = createPostRequest(validSpendRequest)
      await POST(request)

      expect(selectMock).toHaveBeenCalledWith('current_balance')
    })

    it('returns error when user credits cannot be fetched', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      })

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Could not fetch user credits')
    })

    it('returns error when user has insufficient credits', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 5 }, // Less than requested amount
              error: null,
            }),
          }),
        }),
      })

      const request = createPostRequest({
        ...validSpendRequest,
        amount: 10, // More than available balance
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Insufficient credits')
    })

    it('allows spending when user has sufficient credits', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 100 }, // More than requested amount
              error: null,
            }),
          }),
        }),
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest({
        ...validSpendRequest,
        amount: 10,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Credits Deduction', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 100 },
              error: null,
            }),
          }),
        }),
      })
    })

    it('calls deduct_credits stored procedure with correct parameters', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest(validSpendRequest)
      await POST(request)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('deduct_credits', {
        p_user_id: 'test-user-id',
        p_amount: 10,
        p_transaction_type: 'mentor_chat',
        p_metadata: {
          reference_id: 'chat_session_123',
          chat_duration: 300,
          messages_count: 5,
        },
      })
    })

    it('handles stored procedure errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Stored procedure failed' },
      })

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to spend credits')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error spending credits:',
        expect.objectContaining({
          message: 'Stored procedure failed',
        })
      )
    })

    it('processes request without optional metadata', async () => {
      const requestWithoutMetadata = {
        amount: 5,
        transaction_type: 'course_access',
        reference_id: 'course_456',
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest(requestWithoutMetadata)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('deduct_credits', {
        p_user_id: 'test-user-id',
        p_amount: 5,
        p_transaction_type: 'course_access',
        p_metadata: {
          reference_id: 'course_456',
        },
      })
    })
  })

  describe('Notifications', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })
    })

    it('creates notification after successful credit spending', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: insertMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest(validSpendRequest)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        title: 'Créditos utilizados',
        message: 'Has gastado 10 créditos en mentor chat',
        type: 'credit',
        metadata: {
          credits_spent: 10,
          transaction_type: 'mentor_chat',
          reference_id: 'chat_session_123',
          chat_duration: 300,
          messages_count: 5,
        },
      })
    })

    it('formats transaction type in notification message', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: insertMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const requestWithUnderscoreType = {
        ...validSpendRequest,
        transaction_type: 'course_enrollment',
        amount: 15,
      }

      const request = createPostRequest(requestWithUnderscoreType)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Has gastado 15 créditos en course enrollment',
        })
      )
    })

    it('continues processing even if notification fails', async () => {
      const insertMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Notification failed' },
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: insertMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      // Should still succeed even if notification fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })
    })

    it('returns success response with correct data', async () => {
      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        credits_spent: 10,
        remaining_balance: 90, // 100 - 10
      })
    })

    it('calculates remaining balance correctly', async () => {
      const requestWith25Credits = {
        ...validSpendRequest,
        amount: 25,
      }

      const request = createPostRequest(requestWith25Credits)
      const response = await POST(request)
      const data = await response.json()

      expect(data.remaining_balance).toBe(75) // 100 - 25
    })
  })

  describe('Error Handling', () => {
    it('handles unexpected errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Spend credits API error:',
        expect.any(Error)
      )
    })

    it('handles malformed JSON gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      const request = new NextRequest('http://localhost:3000/api/credits/spend', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('handles database connection errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createPostRequest(validSpendRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('handles exact balance spending', async () => {
      // User has exactly 10 credits, trying to spend 10
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 10 },
              error: null,
            }),
          }),
        }),
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 10 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest({
        ...validSpendRequest,
        amount: 10,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.remaining_balance).toBe(0)
    })

    it('handles large credit amounts', async () => {
      const largeAmount = 1000000

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 2000000 },
              error: null,
            }),
          }),
        }),
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 2000000 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest({
        ...validSpendRequest,
        amount: largeAmount,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.credits_spent).toBe(largeAmount)
      expect(data.remaining_balance).toBe(1000000)
    })

    it('handles special characters in metadata', async () => {
      const requestWithSpecialChars = {
        ...validSpendRequest,
        metadata: {
          description: 'Test with special chars: 日本語, émojis 🎉, & symbols',
          reference: 'ref-123_ABC.test',
        },
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { current_balance: 100 },
              error: null,
            }),
          }),
        }),
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { current_balance: 100 },
                error: null,
              }),
            }),
          }),
        }
      })

      const request = createPostRequest(requestWithSpecialChars)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('deduct_credits', {
        p_user_id: 'test-user-id',
        p_amount: 10,
        p_transaction_type: 'mentor_chat',
        p_metadata: {
          reference_id: 'chat_session_123',
          description: 'Test with special chars: 日本語, émojis 🎉, & symbols',
          reference: 'ref-123_ABC.test',
        },
      })
    })
  })
})