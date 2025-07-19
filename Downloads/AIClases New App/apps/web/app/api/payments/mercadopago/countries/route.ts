import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  MERCADOPAGO_COUNTRIES,
  MERCADOPAGO_CREDIT_PACKAGES,
  detectUserCountry,
  getPackagesForCountry,
  formatCurrencyForCountry,
  MercadoPagoCountry
} from '@/lib/payments/mercadopago-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedCountry = searchParams.get('country') as MercadoPagoCountry

    // Detect user's country
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const detectedCountry = detectUserCountry(userAgent, acceptLanguage)
    
    const userCountry = requestedCountry || detectedCountry

    // Get packages for the country
    const packages = getPackagesForCountry(userCountry)

    // Format packages with localized pricing
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      formattedPrice: formatCurrencyForCountry(pkg.price, userCountry),
      totalCredits: pkg.credits + pkg.bonus,
      pricePerCredit: pkg.price / (pkg.credits + pkg.bonus),
      popular: pkg.id.includes('popular'),
      recommended: pkg.id.includes('pro'),
    }))

    // Add special offers based on country
    const specialOffers = getSpecialOffers(userCountry)

    return NextResponse.json({
      country: userCountry,
      countryInfo: MERCADOPAGO_COUNTRIES[userCountry],
      detectedCountry,
      packages: formattedPackages,
      availableCountries: Object.entries(MERCADOPAGO_COUNTRIES).map(([code, info]) => ({
        code,
        name: info.name,
        currency: info.currency,
      })),
      specialOffers,
      paymentMethods: getAvailablePaymentMethods(userCountry),
    })
  } catch (error) {
    console.error('Countries API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSpecialOffers(country: MercadoPagoCountry) {
  const now = new Date()
  const offers = []

  // Weekend bonus (Friday to Sunday)
  const isWeekend = [5, 6, 0].includes(now.getDay())
  if (isWeekend) {
    offers.push({
      id: 'weekend-bonus',
      title: 'Bono de Fin de Semana',
      description: '+100 créditos extra en el paquete Popular',
      validUntil: getNextMonday(),
      countries: ['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY'],
    })
  }

  // First purchase discount
  offers.push({
    id: 'first-purchase',
    title: 'Descuento Primera Compra',
    description: '15% de descuento en tu primera compra',
    validUntil: null, // No expiration
    countries: ['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY'],
  })

  // Country-specific offers
  switch (country) {
    case 'BR':
      offers.push({
        id: 'pix-discount',
        title: 'Desconto PIX',
        description: '10% de desconto pagando com PIX',
        validUntil: null,
        countries: ['BR'],
      })
      break
    
    case 'AR':
      offers.push({
        id: 'cuotas-sin-interes',
        title: 'Cuotas sin Interés',
        description: 'Hasta 12 cuotas sin interés',
        validUntil: null,
        countries: ['AR'],
      })
      break
    
    case 'MX':
      offers.push({
        id: 'oxxo-promotion',
        title: 'Promoción OXXO',
        description: 'Paga en OXXO y recibe créditos extra',
        validUntil: null,
        countries: ['MX'],
      })
      break
  }

  return offers.filter(offer => offer.countries.includes(country))
}

function getAvailablePaymentMethods(country: MercadoPagoCountry) {
  const paymentMethods: Record<MercadoPagoCountry, string[]> = {
    AR: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet_purchase'],
    BR: ['credit_card', 'debit_card', 'pix', 'bank_transfer', 'boleto', 'wallet_purchase'],
    CL: ['credit_card', 'debit_card', 'bank_transfer', 'prepaid_card'],
    CO: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet_purchase'],
    MX: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet_purchase', 'atm'],
    PE: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet_purchase'],
    UY: ['credit_card', 'debit_card', 'bank_transfer', 'cash'],
  }

  const methodNames: Record<string, string> = {
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    bank_transfer: 'Transferencia Bancaria',
    cash: 'Efectivo',
    pix: 'PIX',
    boleto: 'Boleto Bancário',
    wallet_purchase: 'Dinero en Cuenta',
    prepaid_card: 'Tarjeta Prepagada',
    atm: 'Cajero Automático',
  }

  return paymentMethods[country]?.map(method => ({
    id: method,
    name: methodNames[method] || method,
  })) || []
}

function getNextMonday(): string {
  const now = new Date()
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000)
  nextMonday.setHours(23, 59, 59, 999)
  return nextMonday.toISOString()
}