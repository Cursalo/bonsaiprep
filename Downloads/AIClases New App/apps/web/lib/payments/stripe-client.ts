import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'AIClases 4.0',
    version: '4.0.0',
    url: 'https://aiclases.com',
  },
})

// Credit Package Types
export interface CreditPackage {
  id: string
  name: string
  credits: number
  bonus: number
  price: number
  pricePerCredit: number
  popular: boolean
  description: string
  features: string[]
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Paquete Starter',
    credits: 500,
    bonus: 0,
    price: 29,
    pricePerCredit: 0.058,
    popular: false,
    description: 'Perfecto para comenzar tu viaje en IA',
    features: [
      'Acceso a cursos básicos',
      'Mentor AI básico',
      'Certificados estándar',
    ],
  },
  {
    id: 'popular',
    name: 'Paquete Popular',
    credits: 1200,
    bonus: 200,
    price: 59,
    pricePerCredit: 0.049,
    popular: true,
    description: 'El más elegido por nuestros estudiantes',
    features: [
      'Acceso a todos los cursos',
      'Mentor AI avanzado',
      'Certificados premium',
      '200 créditos bonus',
      'Soporte prioritario',
    ],
  },
  {
    id: 'pro',
    name: 'Paquete Pro',
    credits: 2500,
    bonus: 500,
    price: 99,
    pricePerCredit: 0.040,
    popular: false,
    description: 'Para estudiantes serios que quieren dominar la IA',
    features: [
      'Acceso ilimitado',
      'Mentor AI premium',
      'Certificados blockchain',
      '500 créditos bonus',
      'Sesiones 1:1 con instructores',
      'Acceso anticipado a nuevos cursos',
    ],
  },
  {
    id: 'enterprise',
    name: 'Paquete Enterprise',
    credits: 5000,
    bonus: 1000,
    price: 179,
    pricePerCredit: 0.036,
    popular: false,
    description: 'La mejor relación precio-valor',
    features: [
      'Todo lo del Plan Pro',
      '1000 créditos bonus',
      'Acceso a webinars exclusivos',
      'Mentoría grupal mensual',
      'API access para desarrolladores',
      'Certificaciones corporativas',
    ],
  },
]

// Customer Management
export async function createOrGetCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<Stripe.Customer> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId || '',
      createdAt: new Date().toISOString(),
    }
  })
}

// Payment Intents
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {},
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: amount * 100, // Convert to cents
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true
    }
  }

  if (customerId) {
    params.customer = customerId
  }

  return await stripe.paymentIntents.create(params)
}

// Checkout Sessions
export async function createCheckoutSession(
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  customerId: string,
  metadata: Record<string, string> = {},
  options: {
    successUrl?: string
    cancelUrl?: string
    mode?: 'payment' | 'subscription' | 'setup'
  } = {}
): Promise<Stripe.Checkout.Session> {
  const { successUrl, cancelUrl, mode = 'payment' } = options

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?canceled=true`,
    metadata,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    automatic_tax: {
      enabled: true,
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        metadata,
      },
    },
  })
}

// Subscriptions
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  })
}

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Stripe.SubscriptionUpdateParams>
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, updates)
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId)
  }
  
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  })
}

// Invoices
export async function retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  return await stripe.invoices.retrieve(invoiceId)
}

export async function createInvoice(
  customerId: string,
  items: Array<{ price: string; quantity?: number }>,
  metadata: Record<string, string> = {}
): Promise<Stripe.Invoice> {
  // Add invoice items
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      price: item.price,
      quantity: item.quantity || 1,
    })
  }

  // Create and finalize invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    metadata,
    auto_advance: true,
  })

  return await stripe.invoices.finalizeInvoice(invoice.id)
}

// Products and Prices
export async function createProduct(
  name: string,
  description: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Product> {
  return await stripe.products.create({
    name,
    description,
    metadata,
  })
}

export async function createPrice(
  productId: string,
  unitAmount: number,
  currency: string = 'usd',
  recurring?: { interval: 'month' | 'year' }
): Promise<Stripe.Price> {
  const params: Stripe.PriceCreateParams = {
    product: productId,
    unit_amount: unitAmount,
    currency,
  }

  if (recurring) {
    params.recurring = recurring
  }

  return await stripe.prices.create(params)
}

// Webhook Helpers
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// Payment Methods
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  })
}

export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.detach(paymentMethodId)
}

export async function listCustomerPaymentMethods(
  customerId: string,
  type: 'card' | 'sepa_debit' | 'ideal' | 'bancontact' = 'card'
): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type,
  })
}

// Refunds
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    params.amount = amount
  }

  if (reason) {
    params.reason = reason
  }

  return await stripe.refunds.create(params)
}

// Usage Records (for metered billing)
export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  return await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
    }
  )
}

// Helper Functions
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function getCreditPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

export function calculatePackageTotal(packageId: string): number {
  const pkg = getCreditPackageById(packageId)
  return pkg ? pkg.credits + pkg.bonus : 0
}