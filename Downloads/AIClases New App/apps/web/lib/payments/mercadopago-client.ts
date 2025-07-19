// MercadoPago SDK import (requires npm install mercadopago)
import { MercadoPagoApi, Preference, PaymentMethod } from 'mercadopago'

// Initialize MercadoPago client
export const mercadopago = new MercadoPagoApi(process.env.MERCADOPAGO_ACCESS_TOKEN!, {
  locale: 'es-AR',
  integratorId: 'dev_85a4b2f9c3a2d1e8f7b6c5d4e3f2a1b0', // Replace with your integrator ID
  corporationId: 'aiclases',
  platformId: 'aiclases-platform',
})

// MercadoPago supported countries and currencies
export const MERCADOPAGO_COUNTRIES = {
  AR: { currency: 'ARS', name: 'Argentina' },
  BR: { currency: 'BRL', name: 'Brasil' },
  CL: { currency: 'CLP', name: 'Chile' },
  CO: { currency: 'COP', name: 'Colombia' },
  MX: { currency: 'MXN', name: 'México' },
  PE: { currency: 'PEN', name: 'Perú' },
  UY: { currency: 'UYU', name: 'Uruguay' },
} as const

export type MercadoPagoCountry = keyof typeof MERCADOPAGO_COUNTRIES

// Credit packages with LATAM pricing
export const MERCADOPAGO_CREDIT_PACKAGES = {
  AR: [
    { id: 'starter-ar', credits: 500, bonus: 0, price: 7500, currency: 'ARS' },
    { id: 'popular-ar', credits: 1200, bonus: 200, price: 15000, currency: 'ARS' },
    { id: 'pro-ar', credits: 2500, bonus: 500, price: 25000, currency: 'ARS' },
    { id: 'enterprise-ar', credits: 5000, bonus: 1000, price: 45000, currency: 'ARS' },
  ],
  BR: [
    { id: 'starter-br', credits: 500, bonus: 0, price: 150, currency: 'BRL' },
    { id: 'popular-br', credits: 1200, bonus: 200, price: 295, currency: 'BRL' },
    { id: 'pro-br', credits: 2500, bonus: 500, price: 495, currency: 'BRL' },
    { id: 'enterprise-br', credits: 5000, bonus: 1000, price: 895, currency: 'BRL' },
  ],
  CL: [
    { id: 'starter-cl', credits: 500, bonus: 0, price: 24000, currency: 'CLP' },
    { id: 'popular-cl', credits: 1200, bonus: 200, price: 48000, currency: 'CLP' },
    { id: 'pro-cl', credits: 2500, bonus: 500, price: 80000, currency: 'CLP' },
    { id: 'enterprise-cl', credits: 5000, bonus: 1000, price: 145000, currency: 'CLP' },
  ],
  CO: [
    { id: 'starter-co', credits: 500, bonus: 0, price: 120000, currency: 'COP' },
    { id: 'popular-co', credits: 1200, bonus: 200, price: 240000, currency: 'COP' },
    { id: 'pro-co', credits: 2500, bonus: 500, price: 400000, currency: 'COP' },
    { id: 'enterprise-co', credits: 5000, bonus: 1000, price: 720000, currency: 'COP' },
  ],
  MX: [
    { id: 'starter-mx', credits: 500, bonus: 0, price: 580, currency: 'MXN' },
    { id: 'popular-mx', credits: 1200, bonus: 200, price: 1180, currency: 'MXN' },
    { id: 'pro-mx', credits: 2500, bonus: 500, price: 1980, currency: 'MXN' },
    { id: 'enterprise-mx', credits: 5000, bonus: 1000, price: 3580, currency: 'MXN' },
  ],
  PE: [
    { id: 'starter-pe', credits: 500, bonus: 0, price: 110, currency: 'PEN' },
    { id: 'popular-pe', credits: 1200, bonus: 200, price: 220, currency: 'PEN' },
    { id: 'pro-pe', credits: 2500, bonus: 500, price: 370, currency: 'PEN' },
    { id: 'enterprise-pe', credits: 5000, bonus: 1000, price: 670, currency: 'PEN' },
  ],
  UY: [
    { id: 'starter-uy', credits: 500, bonus: 0, price: 1250, currency: 'UYU' },
    { id: 'popular-uy', credits: 1200, bonus: 200, price: 2500, currency: 'UYU' },
    { id: 'pro-uy', credits: 2500, bonus: 500, price: 4200, currency: 'UYU' },
    { id: 'enterprise-uy', credits: 5000, bonus: 1000, price: 7600, currency: 'UYU' },
  ],
}

// Create payment preference
export async function createPaymentPreference(
  packageData: {
    id: string
    credits: number
    bonus: number
    price: number
    currency: string
  },
  userInfo: {
    userId: string
    email: string
    name?: string
  },
  urls: {
    success: string
    failure: string
    pending: string
  }
): Promise<any> {
  try {
    const preference = new Preference(mercadopago)

    const preferenceData = {
      items: [
        {
          id: packageData.id,
          title: `AIClases - ${packageData.credits + packageData.bonus} Créditos`,
          description: `Paquete de ${packageData.credits} créditos base + ${packageData.bonus} créditos bonus`,
          quantity: 1,
          unit_price: packageData.price,
          currency_id: packageData.currency,
          category_id: 'education',
        }
      ],
      payer: {
        email: userInfo.email,
        name: userInfo.name || 'Usuario AIClases',
      },
      back_urls: {
        success: urls.success,
        failure: urls.failure,
        pending: urls.pending,
      },
      auto_return: 'approved',
      external_reference: userInfo.userId,
      metadata: {
        user_id: userInfo.userId,
        package_id: packageData.id,
        credits: packageData.credits.toString(),
        bonus: packageData.bonus.toString(),
        total_credits: (packageData.credits + packageData.bonus).toString(),
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12, // Allow up to 12 installments
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/webhook`,
      statement_descriptor: 'AICLASES',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    }

    const response = await preference.create({ body: preferenceData })
    return response
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    throw error
  }
}

// Get payment information
export async function getPaymentInfo(paymentId: string): Promise<any> {
  try {
    const payment = await mercadopago.payment.get({ id: paymentId })
    return payment
  } catch (error) {
    console.error('Error getting payment info:', error)
    throw error
  }
}

// Get available payment methods for country
export async function getPaymentMethods(country: MercadoPagoCountry): Promise<PaymentMethod[]> {
  try {
    const response = await mercadopago.paymentMethod.get()
    
    // Filter payment methods available for the country
    return response.filter((method: any) => 
      method.additional_info_needed?.includes(country) || 
      !method.additional_info_needed
    )
  } catch (error) {
    console.error('Error getting payment methods:', error)
    throw error
  }
}

// Create merchant order
export async function createMerchantOrder(
  preferenceId: string,
  totalAmount: number,
  currency: string
): Promise<any> {
  try {
    const merchantOrder = {
      preference_id: preferenceId,
      items: [
        {
          title: 'AIClases Credits',
          quantity: 1,
          unit_price: totalAmount,
          currency_id: currency,
        }
      ],
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/webhook`,
    }

    const response = await mercadopago.merchantOrder.create({ body: merchantOrder })
    return response
  } catch (error) {
    console.error('Error creating merchant order:', error)
    throw error
  }
}

// Refund payment
export async function refundPayment(
  paymentId: string,
  amount?: number
): Promise<any> {
  try {
    const refundData = amount ? { amount } : {}
    const response = await mercadopago.refund.create({
      payment_id: paymentId,
      body: refundData
    })
    return response
  } catch (error) {
    console.error('Error processing refund:', error)
    throw error
  }
}

// Get user's country from IP (helper function)
export function detectUserCountry(userAgent?: string, acceptLanguage?: string): MercadoPagoCountry {
  // Simple country detection based on language preferences
  // In production, you might want to use a proper IP geolocation service
  
  if (acceptLanguage) {
    if (acceptLanguage.includes('es-AR')) return 'AR'
    if (acceptLanguage.includes('pt-BR') || acceptLanguage.includes('pt')) return 'BR'
    if (acceptLanguage.includes('es-CL')) return 'CL'
    if (acceptLanguage.includes('es-CO')) return 'CO'
    if (acceptLanguage.includes('es-MX')) return 'MX'
    if (acceptLanguage.includes('es-PE')) return 'PE'
    if (acceptLanguage.includes('es-UY')) return 'UY'
  }
  
  // Default to Mexico if no specific country detected
  return 'MX'
}

// Get packages for user's country
export function getPackagesForCountry(country: MercadoPagoCountry) {
  return MERCADOPAGO_CREDIT_PACKAGES[country] || MERCADOPAGO_CREDIT_PACKAGES.MX
}

// Currency formatting helper
export function formatCurrencyForCountry(
  amount: number, 
  country: MercadoPagoCountry
): string {
  const { currency } = MERCADOPAGO_COUNTRIES[country]
  
  const formatters: Record<string, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    CLP: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }),
    COP: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
    MXN: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }),
    PEN: new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }),
    UYU: new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }),
  }
  
  return formatters[currency]?.format(amount) || `${currency} ${amount}`
}

// Validate webhook signature
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  try {
    const crypto = require('crypto')
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!
    
    // Extract timestamp and signature from x-signature header
    const parts = xSignature.split(',')
    const ts = parts.find(part => part.startsWith('ts='))?.split('=')[1]
    const v1 = parts.find(part => part.startsWith('v1='))?.split('=')[1]
    
    if (!ts || !v1) return false
    
    // Create signed payload
    const signedPayload = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    // Calculate signature
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')
    
    return signature === v1
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}