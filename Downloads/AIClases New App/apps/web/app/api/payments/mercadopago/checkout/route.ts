import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'
import { 
  createPaymentPreference, 
  detectUserCountry, 
  getPackagesForCountry,
  MercadoPagoCountry 
} from '@/lib/payments/mercadopago-client'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId, country: userCountry, successUrl, failureUrl, pendingUrl } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Detect user's country if not provided
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const country: MercadoPagoCountry = userCountry || detectUserCountry(userAgent, acceptLanguage)

    // Get packages for user's country
    const countryPackages = getPackagesForCountry(country)
    const selectedPackage = countryPackages.find(pkg => pkg.id === packageId)
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package ID for selected country' },
        { status: 400 }
      )
    }

    // Create payment preference
    const preference = await createPaymentPreference(
      selectedPackage,
      {
        userId: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
      },
      {
        success: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=true&payment_id={{payment_id}}&status={{status}}&merchant_order_id={{merchant_order_id}}`,
        failure: failureUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?failure=true&payment_id={{payment_id}}&status={{status}}`,
        pending: pendingUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?pending=true&payment_id={{payment_id}}&status={{status}}`,
      }
    )

    // Store pending transaction in database
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: session.user.id,
        type: 'purchase',
        amount: selectedPackage.credits + selectedPackage.bonus,
        description: `Compra MercadoPago - ${selectedPackage.credits + selectedPackage.bonus} créditos`,
        status: 'pending',
        mercadopago_preference_id: preference.id,
        metadata: {
          packageId: selectedPackage.id,
          credits: selectedPackage.credits,
          bonus: selectedPackage.bonus,
          price: selectedPackage.price,
          currency: selectedPackage.currency,
          country,
        },
      })

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      country,
      package: selectedPackage,
    })
  } catch (error) {
    console.error('MercadoPago checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create MercadoPago preference' },
      { status: 500 }
    )
  }
}