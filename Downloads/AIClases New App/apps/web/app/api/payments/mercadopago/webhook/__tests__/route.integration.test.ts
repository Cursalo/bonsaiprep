/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock MercadoPago client functions
const mockGetPaymentInfo = jest.fn()
const mockValidateWebhookSignature = jest.fn()

jest.mock('@/lib/payments/mercadopago-client', () => ({
  getPaymentInfo: mockGetPaymentInfo,
  validateWebhookSignature: mockValidateWebhookSignature,
}))

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock console methods
const originalConsoleError = console.error
const originalConsoleLog = console.log
const mockConsoleError = jest.fn()
const mockConsoleLog = jest.fn()

beforeAll(() => {
  console.error = mockConsoleError
  console.log = mockConsoleLog
})

afterAll(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
})

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

  // Default successful mocks
  mockValidateWebhookSignature.mockReturnValue(true)
  mockSupabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { credits: 100 },
          error: null,
        }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })
})

afterEach(() => {
  process.env = originalEnv
})

describe('/api/payments/mercadopago/webhook', () => {
  const createWebhookRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/payments/mercadopago/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id',
        ...headers,
      },
    })
  }

  const mockPaymentNotification = {
    type: 'payment',
    data: {
      id: 'payment_123456789',
    },
  }

  const mockPaymentDetails = {
    id: 'payment_123456789',
    status: 'approved',
    external_reference: 'user_123',
    preference_id: 'pref_456',
    status_detail: 'accredited',
    metadata: {
      packageId: 'package_basic',
    },
  }

  const mockTransaction = {
    id: 'txn_123',
    user_id: 'user_123',
    amount: 500,
    status: 'pending',
    mercadopago_preference_id: 'pref_456',
    metadata: {
      packageId: 'package_basic',
    },
  }

  describe('Webhook Signature Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('validates webhook signature in production', async () => {
      mockValidateWebhookSignature.mockReturnValue(true)
      mockGetPaymentInfo.mockResolvedValue(mockPaymentDetails)

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('success')
      expect(mockValidateWebhookSignature).toHaveBeenCalledWith(
        'test-signature',
        'test-request-id',
        'payment_123456789'
      )
    })

    it('rejects invalid signature in production', async () => {
      mockValidateWebhookSignature.mockReturnValue(false)

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid signature')
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid MercadoPago webhook signature')
    })

    it('skips signature validation in non-production environments', async () => {
      process.env.NODE_ENV = 'development'
      
      mockGetPaymentInfo.mockResolvedValue(mockPaymentDetails)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockValidateWebhookSignature).not.toHaveBeenCalled()
    })
  })

  describe('Payment Notifications', () => {
    beforeEach(() => {
      mockGetPaymentInfo.mockResolvedValue(mockPaymentDetails)
    })

    it('processes approved payment notification successfully', async () => {
      const approvedPayment = {
        ...mockPaymentDetails,
        status: 'approved',
      }
      mockGetPaymentInfo.mockResolvedValue(approvedPayment)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'credit_transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTransaction,
                  error: null,
                }),
              }),
            }),
            update: updateMock,
            insert: insertMock,
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { credits: 200 },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('success')

      // Verify transaction update
      expect(updateMock).toHaveBeenCalledWith({
        mercadopago_payment_id: 'payment_123456789',
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        status: 'completed',
        completed_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      })

      // Verify award transaction creation
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user_123',
        type: 'award',
        amount: 500,
        description: 'Créditos añadidos por compra MercadoPago',
        status: 'completed',
        metadata: {
          originalTransactionId: 'txn_123',
          mercadopagoPaymentId: undefined, // Will be undefined until transaction is updated
          packageId: 'package_basic',
        },
      })
    })

    it('handles pending payment status', async () => {
      const pendingPayment = {
        ...mockPaymentDetails,
        status: 'pending',
      }
      mockGetPaymentInfo.mockResolvedValue(pendingPayment)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: updateMock,
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        mercadopago_payment_id: 'payment_123456789',
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        status: 'pending',
      })
      expect(mockConsoleLog).toHaveBeenCalledWith('Payment pending for user user_123')
    })

    it('handles rejected payment status', async () => {
      const rejectedPayment = {
        ...mockPaymentDetails,
        status: 'rejected',
        status_detail: 'cc_rejected_insufficient_amount',
      }
      mockGetPaymentInfo.mockResolvedValue(rejectedPayment)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: updateMock,
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        mercadopago_payment_id: 'payment_123456789',
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        status: 'failed',
        metadata: {
          packageId: 'package_basic',
          failure_reason: 'cc_rejected_insufficient_amount',
          mercadopago_status: 'rejected',
        },
      })
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Payment rejected for user user_123: cc_rejected_insufficient_amount'
      )
    })

    it('handles cancelled payment status', async () => {
      const cancelledPayment = {
        ...mockPaymentDetails,
        status: 'cancelled',
        status_detail: 'by_collector',
      }
      mockGetPaymentInfo.mockResolvedValue(cancelledPayment)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: updateMock,
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        mercadopago_payment_id: 'payment_123456789',
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        status: 'failed',
        metadata: {
          packageId: 'package_basic',
          failure_reason: 'by_collector',
          mercadopago_status: 'cancelled',
        },
      })
    })

    it('handles missing external reference (user ID)', async () => {
      const paymentWithoutUserReference = {
        ...mockPaymentDetails,
        external_reference: null,
      }
      mockGetPaymentInfo.mockResolvedValue(paymentWithoutUserReference)

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith('No user ID found in payment external_reference')
    })

    it('handles transaction not found in database', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Transaction not found' },
            }),
          }),
        }),
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Transaction not found:',
        expect.objectContaining({
          userId: 'user_123',
          preferenceId: 'pref_456',
        })
      )
    })

    it('handles unknown payment status', async () => {
      const unknownStatusPayment = {
        ...mockPaymentDetails,
        status: 'unknown_status',
      }
      mockGetPaymentInfo.mockResolvedValue(unknownStatusPayment)

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith('Unknown payment status: unknown_status')
    })
  })

  describe('Credit Processing', () => {
    beforeEach(() => {
      const approvedPayment = {
        ...mockPaymentDetails,
        status: 'approved',
      }
      mockGetPaymentInfo.mockResolvedValue(approvedPayment)
    })

    it('correctly calculates new credit balance', async () => {
      const userUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { credits: 150 }, // Current credits
                  error: null,
                }),
              }),
            }),
            update: userUpdateMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockTransaction, amount: 300 }, // 300 new credits
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      await POST(request)

      // Should update to 150 + 300 = 450 credits
      expect(userUpdateMock).toHaveBeenCalledWith({ credits: 450 })
    })

    it('handles user with zero credits', async () => {
      const userUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { credits: 0 },
                  error: null,
                }),
              }),
            }),
            update: userUpdateMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTransaction,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      await POST(request)

      expect(userUpdateMock).toHaveBeenCalledWith({ credits: 500 })
    })

    it('handles missing user profile gracefully', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'User not found' },
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTransaction,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error fetching user credits:',
        expect.objectContaining({ message: 'User not found' })
      )
    })
  })

  describe('Other Notification Types', () => {
    it('handles merchant order notifications', async () => {
      const merchantOrderNotification = {
        type: 'merchant_order',
        data: {
          id: 'merchant_order_123',
        },
      }

      const request = createWebhookRequest(merchantOrderNotification)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('success')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Processing merchant order notification:',
        'merchant_order_123'
      )
    })

    it('handles plan notifications', async () => {
      const planNotification = {
        type: 'plan',
        data: {
          id: 'plan_123',
        },
      }

      const request = createWebhookRequest(planNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith('Processing plan notification:', 'plan_123')
    })

    it('handles subscription notifications', async () => {
      const subscriptionNotification = {
        type: 'subscription',
        data: {
          id: 'subscription_123',
        },
      }

      const request = createWebhookRequest(subscriptionNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Processing subscription notification:',
        'subscription_123'
      )
    })

    it('handles invoice notifications', async () => {
      const invoiceNotification = {
        type: 'invoice',
        data: {
          id: 'invoice_123',
        },
      }

      const request = createWebhookRequest(invoiceNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith('Processing invoice notification:', 'invoice_123')
    })

    it('handles point integration webhooks', async () => {
      const pointIntegrationNotification = {
        type: 'point_integration_wh',
        data: {
          id: 'point_integration_123',
          status: 'active',
        },
      }

      const request = createWebhookRequest(pointIntegrationNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Point integration webhook:',
        pointIntegrationNotification
      )
    })

    it('handles unknown notification types', async () => {
      const unknownNotification = {
        type: 'unknown_type',
        data: {
          id: 'unknown_123',
        },
      }

      const request = createWebhookRequest(unknownNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Unhandled MercadoPago notification type:',
        'unknown_type'
      )
    })
  })

  describe('Error Handling', () => {
    it('handles MercadoPago API errors gracefully', async () => {
      mockGetPaymentInfo.mockRejectedValue(new Error('MercadoPago API error'))

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200) // Webhook still returns success
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error processing payment notification:',
        expect.any(Error)
      )
    })

    it('handles database errors gracefully', async () => {
      mockGetPaymentInfo.mockResolvedValue(mockPaymentDetails)
      
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error processing payment notification:',
        expect.any(Error)
      )
    })

    it('handles malformed webhook data', async () => {
      const malformedNotification = {
        type: 'payment',
        // Missing data property
      }

      const request = createWebhookRequest(malformedNotification)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook processing failed')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'MercadoPago webhook error:',
        expect.any(Error)
      )
    })

    it('handles JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/mercadopago/webhook', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': 'test-signature',
          'x-request-id': 'test-request-id',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook processing failed')
    })
  })

  describe('Edge Cases and Data Integrity', () => {
    beforeEach(() => {
      const approvedPayment = {
        ...mockPaymentDetails,
        status: 'approved',
      }
      mockGetPaymentInfo.mockResolvedValue(approvedPayment)
    })

    it('handles very large credit amounts', async () => {
      const largeAmountTransaction = {
        ...mockTransaction,
        amount: 1000000,
      }

      const userUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { credits: 50000 },
                  error: null,
                }),
              }),
            }),
            update: userUpdateMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: largeAmountTransaction,
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      await POST(request)

      expect(userUpdateMock).toHaveBeenCalledWith({ credits: 1050000 })
    })

    it('handles concurrent payment notifications for same user', async () => {
      const payment1 = { ...mockPaymentNotification, data: { id: 'payment_1' } }
      const payment2 = { ...mockPaymentNotification, data: { id: 'payment_2' } }

      const payment1Details = { ...mockPaymentDetails, id: 'payment_1' }
      const payment2Details = { ...mockPaymentDetails, id: 'payment_2' }

      // Mock different responses for different payment IDs
      mockGetPaymentInfo
        .mockResolvedValueOnce(payment1Details)
        .mockResolvedValueOnce(payment2Details)

      const requests = [
        createWebhookRequest(payment1),
        createWebhookRequest(payment2),
      ]

      const responses = await Promise.all(requests.map(request => POST(request)))

      // Both should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
      }
    })

    it('handles missing headers gracefully', async () => {
      const request = createWebhookRequest(mockPaymentNotification, {})

      mockGetPaymentInfo.mockResolvedValue(mockPaymentDetails)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTransaction,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'MercadoPago webhook received:',
        expect.objectContaining({
          xSignature: '',
          xRequestId: '',
        })
      )
    })

    it('handles payment with special characters in metadata', async () => {
      const specialCharsPayment = {
        ...mockPaymentDetails,
        metadata: {
          packageId: 'package_español_日本語',
          description: 'Paquete con émojis 🎉 y símbolos especiales & caracteres',
        },
      }
      mockGetPaymentInfo.mockResolvedValue(specialCharsPayment)

      const specialCharsTransaction = {
        ...mockTransaction,
        metadata: {
          packageId: 'package_español_日本語',
          description: 'Paquete con émojis 🎉 y símbolos especiales & caracteres',
        },
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'credit_transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: specialCharsTransaction,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { credits: 100 },
                error: null,
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }
      })

      const request = createWebhookRequest(mockPaymentNotification)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})