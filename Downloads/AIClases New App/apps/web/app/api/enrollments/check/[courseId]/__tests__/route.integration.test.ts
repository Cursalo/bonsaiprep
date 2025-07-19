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

describe('/api/enrollments/check/[courseId]', () => {
  const createGetRequest = (courseId: string) => {
    return new NextRequest(`http://localhost:3000/api/enrollments/check/${courseId}`, {
      method: 'GET',
    })
  }

  const mockEnrollment = {
    id: 'enrollment_123',
    user_id: 'user_123',
    course_id: 'course_456',
    enrolled_at: '2024-01-15T10:00:00Z',
    refunded: false,
    completion_percentage: 75,
    last_accessed: '2024-01-20T14:30:00Z',
  }

  const mockProgress = {
    id: 'progress_123',
    user_id: 'user_123',
    course_id: 'course_456',
    current_lesson_id: 'lesson_5',
    completed_lessons: ['lesson_1', 'lesson_2', 'lesson_3', 'lesson_4'],
    total_lessons: 10,
    completion_percentage: 40,
    time_spent_minutes: 120,
    last_updated: '2024-01-20T14:30:00Z',
  }

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session exists but user ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {}, // No user ID
      })

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Course ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('returns 400 when course ID is missing', async () => {
      const request = createGetRequest('')
      const response = await GET(request, { params: { courseId: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Course ID is required')
    })

    it('accepts valid course ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      })

      const request = createGetRequest('course_valid_123')
      const response = await GET(request, { params: { courseId: 'course_valid_123' } })

      expect(response.status).toBe(200)
    })
  })

  describe('Enrollment Checking - User Not Enrolled', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('returns not enrolled when no enrollment exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      })

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        enrolled: false,
        enrollment: null,
        progress: null,
      })
    })

    it('queries enrollment with correct parameters', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })
      const eqMocks = [jest.fn(), jest.fn(), jest.fn()]
      
      eqMocks[0].mockReturnValue({ eq: eqMocks[1] })
      eqMocks[1].mockReturnValue({ eq: eqMocks[2] })
      eqMocks[2].mockReturnValue({ single: singleMock })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMocks[0],
        }),
      })

      const request = createGetRequest('course_456')
      await GET(request, { params: { courseId: 'course_456' } })

      expect(eqMocks[0]).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(eqMocks[1]).toHaveBeenCalledWith('course_id', 'course_456')
      expect(eqMocks[2]).toHaveBeenCalledWith('refunded', false)
    })
  })

  describe('Enrollment Checking - User Enrolled', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('returns enrollment data when user is enrolled', async () => {
      // Mock enrollment query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProgress,
              error: null,
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        enrolled: true,
        enrollment: mockEnrollment,
        progress: mockProgress,
      })
    })

    it('returns enrollment without progress when progress data is missing', async () => {
      // Mock enrollment query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query returning null
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        enrolled: true,
        enrollment: mockEnrollment,
        progress: null,
      })
    })

    it('fetches progress with correct query parameters', async () => {
      // Mock enrollment query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query with spies
      const progressEqMocks = [jest.fn(), jest.fn()]
      const progressSingleMock = jest.fn().mockResolvedValue({
        data: mockProgress,
        error: null,
      })

      progressEqMocks[0].mockReturnValue({ eq: progressEqMocks[1] })
      progressEqMocks[1].mockReturnValue({ single: progressSingleMock })

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: progressEqMocks[0],
        }),
      }))

      const request = createGetRequest('course_789')
      await GET(request, { params: { courseId: 'course_789' } })

      expect(progressEqMocks[0]).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(progressEqMocks[1]).toHaveBeenCalledWith('course_id', 'course_789')
    })
  })

  describe('Refunded Enrollment Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('excludes refunded enrollments from results', async () => {
      const refundedEnrollment = {
        ...mockEnrollment,
        refunded: true,
      }

      // The query should exclude refunded enrollments, so this should return not found
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found because refunded=false filter
            }),
          }),
        }),
      })

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(false)
      expect(data.enrollment).toBe(null)
    })

    it('includes non-refunded enrollments in results', async () => {
      const nonRefundedEnrollment = {
        ...mockEnrollment,
        refunded: false,
      }

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: nonRefundedEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProgress,
              error: null,
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(true)
      expect(data.enrollment).toEqual(nonRefundedEnrollment)
    })
  })

  describe('Database Error Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('handles enrollment query database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { 
                code: 'PGRST301', // Different error code (not "not found")
                message: 'Database connection failed' 
              },
            }),
          }),
        }),
      })

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check enrollment')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error checking enrollment:',
        expect.objectContaining({
          code: 'PGRST301',
          message: 'Database connection failed',
        })
      )
    })

    it('handles progress query errors gracefully', async () => {
      // Mock successful enrollment query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query with error (but not critical)
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Progress query failed' },
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      // Should still succeed with enrollment data, just no progress
      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(true)
      expect(data.enrollment).toEqual(mockEnrollment)
      expect(data.progress).toBe(null)
    })

    it('distinguishes between "not found" and actual database errors', async () => {
      // Test that PGRST116 (not found) is handled as "not enrolled"
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // This specific code should be treated as "not found"
            }),
          }),
        }),
      })

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(false)
      // Should not log error for "not found"
      expect(mockConsoleError).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Data Integrity', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
    })

    it('handles very long course IDs', async () => {
      const longCourseId = 'course_' + 'a'.repeat(500) // Very long course ID

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const request = createGetRequest(longCourseId)
      const response = await GET(request, { params: { courseId: longCourseId } })

      expect(response.status).toBe(200)
    })

    it('handles special characters in course ID', async () => {
      const specialCourseId = 'course_español_日本語_symbols_&_%'

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const request = createGetRequest(specialCourseId)
      const response = await GET(request, { params: { courseId: specialCourseId } })

      expect(response.status).toBe(200)
    })

    it('handles enrollment with incomplete data', async () => {
      const incompleteEnrollment = {
        id: 'enrollment_incomplete',
        user_id: 'test-user-id',
        course_id: 'course_456',
        // Missing some optional fields
        refunded: false,
      }

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: incompleteEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      // Mock progress query
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(true)
      expect(data.enrollment).toEqual(incompleteEnrollment)
    })

    it('handles progress data with complex metadata', async () => {
      const complexProgress = {
        ...mockProgress,
        metadata: {
          learningStyle: 'visual',
          preferences: {
            speedMultiplier: 1.25,
            subtitles: true,
            language: 'es',
          },
          achievements: ['first_lesson', 'week_streak', 'quick_learner'],
          analytics: {
            averageSessionTime: 25,
            mostActiveHour: 14,
            deviceTypes: ['mobile', 'desktop'],
          },
        },
      }

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEnrollment,
              error: null,
            }),
          }),
        }),
      }))

      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: complexProgress,
              error: null,
            }),
          }),
        }),
      }))

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progress).toEqual(complexProgress)
      expect(data.progress.metadata).toHaveProperty('learningStyle')
      expect(data.progress.metadata).toHaveProperty('achievements')
    })
  })

  describe('User Isolation and Security', () => {
    it('only checks enrollment for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'specific-user-123' },
      })

      const userIdEqMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: userIdEqMock,
        }),
      })

      const request = createGetRequest('course_456')
      await GET(request, { params: { courseId: 'course_456' } })

      expect(userIdEqMock).toHaveBeenCalledWith('user_id', 'specific-user-123')
    })

    it('does not leak enrollment data from other users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user_A' },
      })

      // Simulate another user's enrollment existing but query filtered by user_id
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // No data returned due to user_id filter
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const request = createGetRequest('course_456')
      const response = await GET(request, { params: { courseId: 'course_456' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrolled).toBe(false)
      expect(data.enrollment).toBe(null)
    })
  })

  describe('Error Handling', () => {
    it('handles unexpected errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Enrollment check API error:',
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

      const request = createGetRequest('course_123')
      const response = await GET(request, { params: { courseId: 'course_123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})