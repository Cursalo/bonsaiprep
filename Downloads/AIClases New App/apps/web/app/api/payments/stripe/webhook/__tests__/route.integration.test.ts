/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import Stripe from 'stripe'

// Mock external dependencies
const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    retrieve: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
}

jest.mock('@/lib/payments/stripe-client', () => ({
  stripe: mockStripe,
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
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  }

  // Default successful mock for Supabase operations
  mockSupabaseClient.from.mockReturnValue({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: { credits: 100 }, 
          error: null 
        }),
      }),
    }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })
})

afterEach(() => {
  process.env = originalEnv
})

describe('/api/payments/stripe/webhook', () => {
  const createWebhookRequest = (body: string, signature: string) => {
    return new NextRequest('http://localhost:3000/api/payments/stripe/webhook', {
      method: 'POST',
      body,
      headers: {
        'stripe-signature': signature,
        'Content-Type': 'application/json',
      },
    })
  }

  const mockEvent = (type: string, data: any): Stripe.Event => ({
    id: 'evt_test_123',
    object: 'event',
    created: Date.now() / 1000,
    data: { object: data },
    type: type as any,
    livemode: false,
    pending_webhooks: 1,
    request: { id: 'req_test', idempotency_key: null },
    api_version: '2023-10-16',
  })

  describe('Webhook Signature Verification', () => {
    it('returns 400 when webhook signature verification fails', async () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = 'invalid_signature'

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Webhook signature verification failed')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Webhook signature verification failed:',
        expect.any(Error)
      )
    })

    it('processes webhook when signature verification succeeds', async () => {
      const eventData = mockEvent('checkout.session.completed', {
        id: 'cs_test_123',
        metadata: {
          userId: 'user_123',
          packageId: 'package_basic',
          credits: '500',
          bonus: '50',
        },
        payment_intent: 'pi_test_123',
      })

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(eventData)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  describe('Checkout Session Completed Event', () => {
    const mockCheckoutSession: Stripe.Checkout.Session = {
      id: 'cs_test_123',
      object: 'checkout.session',
      metadata: {
        userId: 'user_123',
        packageId: 'package_basic',
        credits: '500',
        bonus: '50',
      },
      payment_intent: 'pi_test_123',
    } as any

    beforeEach(() => {
      const eventData = mockEvent('checkout.session.completed', mockCheckoutSession)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)
    })

    it('successfully processes checkout session with complete metadata', async () => {
      const body = JSON.stringify(mockCheckoutSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Verify transaction status update
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('credit_transactions')
      
      // Verify user credits update
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
    })

    it('handles missing userId in metadata', async () => {
      const sessionWithoutUserId = {
        ...mockCheckoutSession,
        metadata: {
          packageId: 'package_basic',
          credits: '500',
        },
      }

      const eventData = mockEvent('checkout.session.completed', sessionWithoutUserId)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(sessionWithoutUserId)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Missing required metadata in checkout session:',
        'cs_test_123'
      )
    })

    it('handles missing packageId in metadata', async () => {
      const sessionWithoutPackageId = {
        ...mockCheckoutSession,
        metadata: {
          userId: 'user_123',
          credits: '500',
        },
      }

      const eventData = mockEvent('checkout.session.completed', sessionWithoutPackageId)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(sessionWithoutPackageId)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Missing required metadata in checkout session:',
        'cs_test_123'
      )
    })

    it('calculates total credits correctly with bonus', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { credits: 200 }, 
                  error: null 
                }),
              }),
            }),
            update: updateMock,
          }
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }
      })

      const body = JSON.stringify(mockCheckoutSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      await POST(request)

      // Should update user credits with base (500) + bonus (50) = 550 total
      // Current credits (200) + new credits (550) = 750
      expect(updateMock).toHaveBeenCalledWith({ credits: 750 })
    })

    it('handles database errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      })

      const body = JSON.stringify(mockCheckoutSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error updating transaction:',
        expect.objectContaining({ message: 'Database error' })
      )
    })

    it('creates award transaction with correct metadata', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'credit_transactions' && insertMock.mock.calls.length === 0) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
            insert: insertMock,
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { credits: 100 }, 
                error: null 
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: insertMock,
        }
      })

      const body = JSON.stringify(mockCheckoutSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user_123',
        type: 'award',
        amount: 550, // 500 + 50 bonus
        description: 'Créditos añadidos por compra de package_basic',
        status: 'completed',
        metadata: {
          packageId: 'package_basic',
          purchaseSessionId: 'cs_test_123',
          baseCredits: 500,
          bonusCredits: 50,
        },
      })
    })
  })

  describe('Payment Intent Events', () => {
    it('handles payment_intent.succeeded event', async () => {
      const paymentIntent = {
        id: 'pi_test_123',
        object: 'payment_intent',
        status: 'succeeded',
      }

      const eventData = mockEvent('payment_intent.succeeded', paymentIntent)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(paymentIntent)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith('Payment succeeded:', 'pi_test_123')
    })

    it('handles payment_intent.payment_failed event', async () => {
      const paymentIntent = {
        id: 'pi_test_failed',
        object: 'payment_intent',
        status: 'failed',
        last_payment_error: {
          message: 'Your card was declined.',
        },
      }

      const eventData = mockEvent('payment_intent.payment_failed', paymentIntent)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      })

      const body = JSON.stringify(paymentIntent)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        status: 'failed',
        metadata: {
          error: 'Your card was declined.',
        },
      })
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Payment failed:',
        'pi_test_failed',
        'Your card was declined.'
      )
    })

    it('handles payment failure without error message', async () => {
      const paymentIntent = {
        id: 'pi_test_failed_no_msg',
        object: 'payment_intent',
        status: 'failed',
      }

      const eventData = mockEvent('payment_intent.payment_failed', paymentIntent)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      })

      const body = JSON.stringify(paymentIntent)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      await POST(request)

      expect(updateMock).toHaveBeenCalledWith({
        status: 'failed',
        metadata: {
          error: 'Payment failed',
        },
      })
    })
  })

  describe('Subscription Events', () => {
    const mockCustomer: Stripe.Customer = {
      id: 'cus_test_123',
      object: 'customer',
      metadata: {
        userId: 'user_123',
      },
    } as any

    const mockSubscription: Stripe.Subscription = {
      id: 'sub_test_123',
      object: 'subscription',
      customer: 'cus_test_123',
      status: 'active',
      current_period_start: 1640995200, // 2022-01-01 00:00:00 UTC
      current_period_end: 1643673600,   // 2022-02-01 00:00:00 UTC
      items: {
        object: 'list',
        data: [{
          id: 'si_test',
          object: 'subscription_item',
          price: {
            id: 'price_test_123',
            object: 'price',
            product: 'prod_test_123',
          } as any,
        }] as any,
      } as any,
    } as any

    beforeEach(() => {
      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer)
    })

    it('handles customer.subscription.created event', async () => {
      const eventData = mockEvent('customer.subscription.created', mockSubscription)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
      })

      const body = JSON.stringify(mockSubscription)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user_123',
        stripe_subscription_id: 'sub_test_123',
        stripe_customer_id: 'cus_test_123',
        status: 'active',
        current_period_start: '2022-01-01T00:00:00.000Z',
        current_period_end: '2022-02-01T00:00:00.000Z',
        metadata: {
          priceId: 'price_test_123',
          productId: 'prod_test_123',
        },
      })
    })

    it('handles subscription creation without userId in customer metadata', async () => {
      const customerWithoutUserId = {
        ...mockCustomer,
        metadata: {},
      }
      mockStripe.customers.retrieve.mockResolvedValue(customerWithoutUserId)

      const eventData = mockEvent('customer.subscription.created', mockSubscription)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(mockSubscription)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Missing userId in customer metadata for subscription:',
        'sub_test_123'
      )
    })

    it('handles customer.subscription.updated event', async () => {
      const updatedSubscription = {
        ...mockSubscription,
        status: 'past_due',
        current_period_start: 1643673600, // 2022-02-01 00:00:00 UTC
        current_period_end: 1646092800,   // 2022-03-01 00:00:00 UTC
      }

      const eventData = mockEvent('customer.subscription.updated', updatedSubscription)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      })

      const body = JSON.stringify(updatedSubscription)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        status: 'past_due',
        current_period_start: '2022-02-01T00:00:00.000Z',
        current_period_end: '2022-03-01T00:00:00.000Z',
      })
    })

    it('handles customer.subscription.deleted event', async () => {
      const eventData = mockEvent('customer.subscription.deleted', mockSubscription)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        update: updateMock,
      })

      const body = JSON.stringify(mockSubscription)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith({
        status: 'canceled',
        canceled_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      })
    })
  })

  describe('Invoice Events', () => {
    const mockInvoice: Stripe.Invoice = {
      id: 'in_test_123',
      object: 'invoice',
      subscription: 'sub_test_123',
      status: 'paid',
    } as any

    const mockSubscription: Stripe.Subscription = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
    } as any

    const mockCustomer: Stripe.Customer = {
      id: 'cus_test_123',
      metadata: {
        userId: 'user_123',
      },
    } as any

    beforeEach(() => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer)
    })

    it('handles invoice.payment_succeeded event for subscription', async () => {
      const eventData = mockEvent('invoice.payment_succeeded', mockInvoice)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { credits: 500 }, 
                  error: null 
                }),
              }),
            }),
            update: updateMock,
          }
        }
        return {
          insert: insertMock,
        }
      })

      const body = JSON.stringify(mockInvoice)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Should add monthly subscription credits (1000) to existing credits (500) = 1500
      expect(updateMock).toHaveBeenCalledWith({ credits: 1500 })
      
      // Should create subscription credit transaction
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user_123',
        type: 'subscription',
        amount: 1000,
        description: 'Créditos mensuales de suscripción',
        status: 'completed',
        metadata: {
          subscriptionId: 'sub_test_123',
          period: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        },
      })
    })

    it('handles invoice.payment_succeeded for non-subscription invoice', async () => {
      const nonSubscriptionInvoice = {
        ...mockInvoice,
        subscription: null,
      }

      const eventData = mockEvent('invoice.payment_succeeded', nonSubscriptionInvoice)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(nonSubscriptionInvoice)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should not call subscription credit logic
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled()
    })

    it('handles invoice.payment_failed event', async () => {
      const eventData = mockEvent('invoice.payment_failed', mockInvoice)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(mockInvoice)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockConsoleLog).toHaveBeenCalledWith('Invoice payment failed:', 'in_test_123')
    })
  })

  describe('Unhandled Events', () => {
    it('logs unhandled event types and returns success', async () => {
      const unknownEvent = mockEvent('customer.updated', { id: 'cus_test' })
      mockStripe.webhooks.constructEvent.mockReturnValue(unknownEvent)

      const body = JSON.stringify({ id: 'cus_test' })
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith('Unhandled event type: customer.updated')
    })
  })

  describe('Error Handling', () => {
    it('handles webhook processing errors gracefully', async () => {
      const eventData = mockEvent('checkout.session.completed', {
        id: 'cs_test_error',
        metadata: {
          userId: 'user_123',
          packageId: 'package_basic',
          credits: '500',
        },
      })

      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      // Make database operations fail
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const body = JSON.stringify(eventData)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook processing failed')
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Webhook processing error:',
        expect.any(Error)
      )
    })

    it('handles malformed webhook data', async () => {
      const malformedEvent = {
        type: 'checkout.session.completed',
        data: {
          object: null, // Malformed data
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(malformedEvent as any)

      const body = JSON.stringify(malformedEvent)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Webhook processing error:',
        expect.any(Error)
      )
    })

    it('handles missing environment variables gracefully', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const body = JSON.stringify({ test: 'data' })
      const signature = 'valid_signature'

      // This should cause an error when accessing the endpoint secret
      const request = createWebhookRequest(body, signature)
      
      // The error will be caught in the signature verification step
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Missing webhook secret')
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Data Integrity', () => {
    it('handles zero credit amounts', async () => {
      const zeroCreditsSession = {
        id: 'cs_zero_credits',
        metadata: {
          userId: 'user_123',
          packageId: 'package_free',
          credits: '0',
          bonus: '0',
        },
        payment_intent: 'pi_free',
      }

      const eventData = mockEvent('checkout.session.completed', zeroCreditsSession)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(zeroCreditsSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should still process the transaction even with 0 credits
    })

    it('handles very large credit amounts', async () => {
      const largeCreditsSession = {
        id: 'cs_large_credits',
        metadata: {
          userId: 'user_123',
          packageId: 'package_enterprise',
          credits: '1000000',
          bonus: '500000',
        },
        payment_intent: 'pi_large',
      }

      const eventData = mockEvent('checkout.session.completed', largeCreditsSession)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { credits: 10000 }, 
                  error: null 
                }),
              }),
            }),
            update: updateMock,
          }
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }
      })

      const body = JSON.stringify(largeCreditsSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should handle large numbers correctly: 10000 + 1000000 + 500000 = 1510000
      expect(updateMock).toHaveBeenCalledWith({ credits: 1510000 })
    })

    it('handles concurrent webhook processing', async () => {
      const session1 = {
        id: 'cs_concurrent_1',
        metadata: {
          userId: 'user_123',
          packageId: 'package_basic',
          credits: '100',
          bonus: '10',
        },
        payment_intent: 'pi_concurrent_1',
      }

      const session2 = {
        id: 'cs_concurrent_2',
        metadata: {
          userId: 'user_123',
          packageId: 'package_basic',
          credits: '200',
          bonus: '20',
        },
        payment_intent: 'pi_concurrent_2',
      }

      const event1 = mockEvent('checkout.session.completed', session1)
      const event2 = mockEvent('checkout.session.completed', session2)

      const requests = [
        { event: event1, body: JSON.stringify(session1) },
        { event: event2, body: JSON.stringify(session2) },
      ]

      const responses = await Promise.all(
        requests.map(async ({ event, body }) => {
          mockStripe.webhooks.constructEvent.mockReturnValue(event)
          const request = createWebhookRequest(body, 'valid_signature')
          return POST(request)
        })
      )

      // Both should succeed (database should handle concurrency)
      for (const response of responses) {
        expect(response.status).toBe(200)
      }
    })

    it('handles special characters in metadata', async () => {
      const specialCharsSession = {
        id: 'cs_special_chars',
        metadata: {
          userId: 'user_123',
          packageId: 'package_español_日本語',
          credits: '100',
          bonus: '10',
          description: 'Package with émojis 🎉 and symbols & special chars',
        },
        payment_intent: 'pi_special',
      }

      const eventData = mockEvent('checkout.session.completed', specialCharsSession)
      mockStripe.webhooks.constructEvent.mockReturnValue(eventData)

      const body = JSON.stringify(specialCharsSession)
      const signature = 'valid_signature'

      const request = createWebhookRequest(body, signature)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})