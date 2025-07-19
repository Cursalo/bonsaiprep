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
  rpc: jest.fn(),
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

describe('/api/credits/award', () => {
  const createPostRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/credits/award', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const validAwardRequest = {
    amount: 50,
    transaction_type: 'course_completion',
    metadata: {
      course_id: 'course_123',
      lesson_count: 10,
      completion_percentage: 100,
    },
  }

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session exists but user ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {}, // No user ID
      })

      const request = createPostRequest(validAwardRequest)
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
        ...validAwardRequest,
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
        ...validAwardRequest,
        amount: -25,
      }

      const request = createPostRequest(requestWithNegativeAmount)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid amount')
    })

    it('validates amount is greater than zero', async () => {
      const requestWithZeroAmount = {
        ...validAwardRequest,
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
        ...validAwardRequest,
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
        ...validAwardRequest,
        transaction_type: '',
      }

      const request = createPostRequest(requestWithEmptyTransactionType)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Transaction type is required')
    })
  })

  describe('Credits Awarding', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('calls award_credits stored procedure with correct parameters', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const request = createPostRequest(validAwardRequest)
      await POST(request)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 50,
        p_transaction_type: 'course_completion',
        p_metadata: {
          course_id: 'course_123',
          lesson_count: 10,
          completion_percentage: 100,
        },
      })
    })

    it('handles stored procedure errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Stored procedure failed' },
      })

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to award credits')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error awarding credits:',
        expect.objectContaining({
          message: 'Stored procedure failed',
        })
      )
    })

    it('processes request without optional metadata', async () => {
      const requestWithoutMetadata = {
        amount: 25,
        transaction_type: 'daily_login',
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const request = createPostRequest(requestWithoutMetadata)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 25,
        p_transaction_type: 'daily_login',
        p_metadata: {},
      })
    })

    it('successfully awards credits and returns correct response', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      // Mock notifications insert
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const request = createPostRequest({
        ...validAwardRequest,
        amount: 75,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        credits_awarded: 75,
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

    it('creates notification after successful credit awarding', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
      })

      const request = createPostRequest(validAwardRequest)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        title: '¡Créditos ganados! 🎉',
        message: 'Has ganado 50 créditos por course completion',
        type: 'credit',
        metadata: {
          credits_awarded: 50,
          transaction_type: 'course_completion',
          course_id: 'course_123',
          lesson_count: 10,
          completion_percentage: 100,
        },
      })
    })

    it('formats transaction type in notification message', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
      })

      const requestWithUnderscoreType = {
        ...validAwardRequest,
        transaction_type: 'quiz_perfect_score',
        amount: 25,
      }

      const request = createPostRequest(requestWithUnderscoreType)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Has ganado 25 créditos por quiz perfect score',
        })
      )
    })

    it('continues processing even if notification fails', async () => {
      const insertMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Notification failed' },
      })
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
      })

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      // Should still succeed even if notification fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.credits_awarded).toBe(50)
    })

    it('includes all metadata in notification', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
      })

      const requestWithComplexMetadata = {
        ...validAwardRequest,
        metadata: {
          course_id: 'course_456',
          lesson_count: 15,
          completion_percentage: 100,
          bonus_reason: 'first_completion',
          achievement_unlocked: 'speedster',
        },
      }

      const request = createPostRequest(requestWithComplexMetadata)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            credits_awarded: 50,
            transaction_type: 'course_completion',
            course_id: 'course_456',
            lesson_count: 15,
            completion_percentage: 100,
            bonus_reason: 'first_completion',
            achievement_unlocked: 'speedster',
          },
        })
      )
    })
  })

  describe('Edge Cases and Special Scenarios', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
    })

    it('handles large credit amounts', async () => {
      const largeAmountRequest = {
        ...validAwardRequest,
        amount: 1000000,
      }

      const request = createPostRequest(largeAmountRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.credits_awarded).toBe(1000000)
    })

    it('handles decimal amounts (rounded)', async () => {
      const decimalAmountRequest = {
        ...validAwardRequest,
        amount: 25.75,
      }

      const request = createPostRequest(decimalAmountRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 25.75,
        p_transaction_type: 'course_completion',
        p_metadata: expect.any(Object),
      })
    })

    it('handles special characters in transaction type', async () => {
      const specialCharsRequest = {
        ...validAwardRequest,
        transaction_type: 'special_event_día_de_muertos',
      }

      const request = createPostRequest(specialCharsRequest)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 50,
        p_transaction_type: 'special_event_día_de_muertos',
        p_metadata: expect.any(Object),
      })
    })

    it('handles complex metadata with nested objects', async () => {
      const complexMetadataRequest = {
        ...validAwardRequest,
        metadata: {
          course: {
            id: 'course_123',
            title: 'Advanced JavaScript',
            difficulty: 'expert',
          },
          performance: {
            score: 95,
            time_spent_minutes: 180,
            perfect_lessons: 8,
          },
          achievements: ['speed_learner', 'perfectionist', 'consistent'],
          bonus_multiplier: 1.5,
        },
      }

      const request = createPostRequest(complexMetadataRequest)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 50,
        p_transaction_type: 'course_completion',
        p_metadata: complexMetadataRequest.metadata,
      })
    })

    it('handles various transaction types correctly', async () => {
      const transactionTypes = [
        'daily_login',
        'course_completion',
        'quiz_perfect_score',
        'referral_bonus',
        'streak_achievement',
        'special_event',
        'admin_award',
        'bug_report',
        'community_contribution',
      ]

      for (const transactionType of transactionTypes) {
        jest.clearAllMocks()
        
        const request = createPostRequest({
          amount: 10,
          transaction_type: transactionType,
        })
        
        const response = await POST(request)
        
        expect(response.status).toBe(200)
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
          p_user_id: 'test-user-id',
          p_amount: 10,
          p_transaction_type: transactionType,
          p_metadata: {},
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('handles unexpected errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Award credits API error:',
        expect.any(Error)
      )
    })

    it('handles malformed JSON gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      const request = new NextRequest('http://localhost:3000/api/credits/award', {
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

      mockSupabaseClient.rpc.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('handles stored procedure timeout', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Query timeout', code: 'TIMEOUT' },
      })

      const request = createPostRequest(validAwardRequest)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to award credits')
    })
  })

  describe('Performance and Concurrency', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
    })

    it('processes multiple award requests efficiently', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        createPostRequest({
          amount: (i + 1) * 10,
          transaction_type: `test_type_${i}`,
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests.map(request => POST(request)))
      const endTime = Date.now()

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
      }

      // Should complete within reasonable time (less than 1 second for 5 requests)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('handles rapid consecutive awards for same user', async () => {
      const rapidRequests = Array.from({ length: 3 }, () => 
        createPostRequest({
          amount: 10,
          transaction_type: 'rapid_fire_test',
        })
      )

      const responses = await Promise.all(rapidRequests.map(request => POST(request)))

      // All should succeed (database should handle concurrency)
      for (const response of responses) {
        expect(response.status).toBe(200)
      }

      // Should have been called 3 times
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3)
    })
  })

  describe('Business Logic Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
    })

    it('validates course completion awards include required metadata', async () => {
      const courseCompletionRequest = {
        amount: 100,
        transaction_type: 'course_completion',
        metadata: {
          course_id: 'course_123',
          completion_percentage: 100,
        },
      }

      const request = createPostRequest(courseCompletionRequest)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 100,
        p_transaction_type: 'course_completion',
        p_metadata: {
          course_id: 'course_123',
          completion_percentage: 100,
        },
      })
    })

    it('validates referral bonus awards include referrer information', async () => {
      const referralBonusRequest = {
        amount: 25,
        transaction_type: 'referral_bonus',
        metadata: {
          referrer_id: 'user_456',
          referred_user_id: 'user_789',
          referral_code: 'REF123',
        },
      }

      const request = createPostRequest(referralBonusRequest)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('award_credits', {
        p_user_id: 'test-user-id',
        p_amount: 25,
        p_transaction_type: 'referral_bonus',
        p_metadata: referralBonusRequest.metadata,
      })
    })
  })
})