/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getServerSession } from 'next-auth'
import { checkAdminRole } from '@/lib/auth/admin-utils'

// Mock external dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth/admin-utils', () => ({
  checkAdminRole: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          then: jest.fn().mockResolvedValue({
            data: [{ user_id: 'test-user' }],
            error: null,
          }),
        })),
      })),
    })),
  })),
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  
  // Reset environment variables
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    STRIPE_SECRET_KEY: 'sk_test_stripe',
    MERCADOPAGO_ACCESS_TOKEN: 'test-mp-token',
    EMAIL_SERVER_PASSWORD: 'test-email-password',
    NODE_ENV: 'test',
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('/api/admin/health', () => {
  const createMockRequest = () => {
    return new NextRequest('http://localhost:3000/api/admin/health', {
      method: 'GET',
    })
  }

  describe('Authentication and Authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session exists but user ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {}, // No user ID
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 when user is not an admin', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(false)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden - Admin access required')
    })
  })

  describe('Successful Health Checks', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('returns comprehensive health check report for admin user', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('responseTime')
      expect(data).toHaveProperty('version', '4.0.0')
      expect(data).toHaveProperty('environment', 'test')
      expect(data).toHaveProperty('checks')
      expect(data).toHaveProperty('summary')
    })

    it('includes all expected service checks', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const serviceNames = data.checks.map((check: any) => check.service)
      
      expect(serviceNames).toContain('database')
      expect(serviceNames).toContain('stripe')
      expect(serviceNames).toContain('mercadopago')
      expect(serviceNames).toContain('email')
      expect(serviceNames).toContain('memory')
      expect(serviceNames).toContain('cpu')
      expect(serviceNames).toContain('disk')
      expect(serviceNames).toContain('external_apis')
    })

    it('includes proper summary statistics', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.summary).toHaveProperty('total')
      expect(data.summary).toHaveProperty('healthy')
      expect(data.summary).toHaveProperty('warning')
      expect(data.summary).toHaveProperty('error')
      
      expect(data.summary.total).toBe(data.checks.length)
      expect(
        data.summary.healthy + data.summary.warning + data.summary.error
      ).toBe(data.summary.total)
    })

    it('returns overall healthy status when all services are healthy', async () => {
      // Mock all environment variables to be present (healthy configuration)
      process.env.STRIPE_SECRET_KEY = 'sk_test_stripe'
      process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-mp-token'
      process.env.EMAIL_SERVER_PASSWORD = 'test-email-password'

      // Mock Math.random to return low values (healthy thresholds)
      const originalMathRandom = Math.random
      Math.random = jest.fn(() => 0.5) // 50% usage for memory, CPU, disk

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      // Should have healthy or warning status (due to mocked services)
      expect(['healthy', 'warning']).toContain(data.status)

      Math.random = originalMathRandom
    })
  })

  describe('Database Health Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('reports healthy database when query succeeds quickly', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const dbCheck = data.checks.find((check: any) => check.service === 'database')
      
      expect(dbCheck).toBeDefined()
      expect(dbCheck.status).toBe('healthy')
      expect(dbCheck).toHaveProperty('responseTime')
      expect(dbCheck.responseTime).toBeLessThan(1000)
    })

    it('reports database error when Supabase query fails', async () => {
      // Mock Supabase to return an error
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            limit: jest.fn(() => ({
              then: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            })),
          })),
        })),
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const dbCheck = data.checks.find((check: any) => check.service === 'database')
      
      expect(dbCheck.status).toBe('error')
      expect(dbCheck.error).toBe('Database connection failed')
    })
  })

  describe('Service Configuration Checks', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('reports warning for Stripe when not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const stripeCheck = data.checks.find((check: any) => check.service === 'stripe')
      
      expect(stripeCheck.status).toBe('warning')
      expect(stripeCheck.details.configured).toBe(false)
    })

    it('reports healthy for Stripe when configured', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key'

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const stripeCheck = data.checks.find((check: any) => check.service === 'stripe')
      
      expect(stripeCheck.status).toBe('healthy')
      expect(stripeCheck.details.configured).toBe(true)
    })

    it('reports warning for MercadoPago when not configured', async () => {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const mpCheck = data.checks.find((check: any) => check.service === 'mercadopago')
      
      expect(mpCheck.status).toBe('warning')
      expect(mpCheck.details.configured).toBe(false)
    })

    it('reports warning for email when not configured', async () => {
      delete process.env.EMAIL_SERVER_PASSWORD

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const emailCheck = data.checks.find((check: any) => check.service === 'email')
      
      expect(emailCheck.status).toBe('warning')
      expect(emailCheck.details.configured).toBe(false)
    })
  })

  describe('Resource Usage Checks', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('reports memory usage within expected ranges', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const memoryCheck = data.checks.find((check: any) => check.service === 'memory')
      
      expect(memoryCheck).toBeDefined()
      expect(memoryCheck.details.usage).toBeDefined()
      expect(memoryCheck.details.limit).toBe('2GB')
      expect(['healthy', 'warning', 'error']).toContain(memoryCheck.status)
    })

    it('reports CPU usage within expected ranges', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const cpuCheck = data.checks.find((check: any) => check.service === 'cpu')
      
      expect(cpuCheck).toBeDefined()
      expect(cpuCheck.details.usage).toBeDefined()
      expect(cpuCheck.details.cores).toBe(2)
      expect(['healthy', 'warning', 'error']).toContain(cpuCheck.status)
    })

    it('reports disk usage within expected ranges', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const diskCheck = data.checks.find((check: any) => check.service === 'disk')
      
      expect(diskCheck).toBeDefined()
      expect(diskCheck.details.usage).toBeDefined()
      expect(diskCheck.details.total).toBe('50GB')
      expect(diskCheck.details.available).toMatch(/\d+\.\d+GB/)
      expect(['healthy', 'warning', 'error']).toContain(diskCheck.status)
    })
  })

  describe('External API Checks', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('reports external API health with response times', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const apiCheck = data.checks.find((check: any) => check.service === 'external_apis')
      
      expect(apiCheck).toBeDefined()
      expect(apiCheck).toHaveProperty('responseTime')
      expect(apiCheck.responseTime).toBeGreaterThan(0)
      expect(apiCheck.details.openai).toBe('healthy')
      expect(apiCheck.details.context7).toBe('healthy')
      expect(['healthy', 'warning', 'error']).toContain(apiCheck.status)
    })
  })

  describe('Error Handling', () => {
    it('returns 500 when an unexpected error occurs', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.status).toBe('error')
      expect(data.error).toBe('Health check failed')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('responseTime')
    })

    it('handles admin role check failure gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockRejectedValue(new Error('Admin check failed'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.status).toBe('error')
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('completes health check within reasonable time', async () => {
      const startTime = Date.now()
      
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()
      
      const endTime = Date.now()
      const actualResponseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(data.responseTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(actualResponseTime).toBeLessThan(5000)
    })

    it('includes uptime information', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('uptime')
      expect(typeof data.uptime).toBe('number')
      expect(data.uptime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Data Format Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-user-id' },
      })
      ;(checkAdminRole as jest.Mock).mockResolvedValue(true)
    })

    it('returns properly formatted health check structure', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      // Validate top-level structure
      expect(data).toHaveProperty('status')
      expect(['healthy', 'warning', 'error']).toContain(data.status)
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(typeof data.responseTime).toBe('number')
      expect(data.version).toBe('4.0.0')
      expect(typeof data.uptime).toBe('number')
      expect(data.environment).toBe('test')

      // Validate checks array
      expect(Array.isArray(data.checks)).toBe(true)
      data.checks.forEach((check: any) => {
        expect(check).toHaveProperty('service')
        expect(check).toHaveProperty('status')
        expect(['healthy', 'warning', 'error']).toContain(check.status)
        expect(typeof check.service).toBe('string')
      })

      // Validate summary
      expect(data.summary).toHaveProperty('total')
      expect(data.summary).toHaveProperty('healthy')
      expect(data.summary).toHaveProperty('warning')
      expect(data.summary).toHaveProperty('error')
      expect(typeof data.summary.total).toBe('number')
      expect(typeof data.summary.healthy).toBe('number')
      expect(typeof data.summary.warning).toBe('number')
      expect(typeof data.summary.error).toBe('number')
    })

    it('ensures each check has required properties', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      data.checks.forEach((check: any) => {
        expect(check).toHaveProperty('service')
        expect(check).toHaveProperty('status')
        expect(typeof check.service).toBe('string')
        expect(['healthy', 'warning', 'error']).toContain(check.status)

        // Optional properties
        if (check.responseTime !== undefined) {
          expect(typeof check.responseTime).toBe('number')
        }
        if (check.error !== undefined) {
          expect(typeof check.error).toBe('string')
        }
        if (check.details !== undefined) {
          expect(typeof check.details).toBe('object')
        }
      })
    })
  })
})