import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/payments/stripe-client'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'

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
    const { packageId, successUrl, cancelUrl } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Get credit package details
    const creditPackages = [
      { id: 'starter', credits: 500, bonus: 0, price: 29, name: 'Paquete Starter' },
      { id: 'popular', credits: 1200, bonus: 200, price: 59, name: 'Paquete Popular' },
      { id: 'pro', credits: 2500, bonus: 500, price: 99, name: 'Paquete Pro' },
      { id: 'enterprise', credits: 5000, bonus: 1000, price: 179, name: 'Paquete Enterprise' },
    ]

    const selectedPackage = creditPackages.find(pkg => pkg.id === packageId)
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomer
    const existingCustomer = await stripe.customers.list({
      email: session.user.email!,
      limit: 1
    })

    if (existingCustomer.data.length > 0) {
      stripeCustomer = existingCustomer.data[0]
    } else {
      stripeCustomer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        }
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits + selectedPackage.bonus} AICredits total (${selectedPackage.credits} base + ${selectedPackage.bonus} bonus)`,
              images: ['https://aiclases.com/credits-icon.png'],
              metadata: {
                packageId: selectedPackage.id,
                credits: selectedPackage.credits.toString(),
                bonus: selectedPackage.bonus.toString(),
              }
            },
            unit_amount: selectedPackage.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?canceled=true`,
      metadata: {
        userId: session.user.id,
        packageId: selectedPackage.id,
        credits: selectedPackage.credits.toString(),
        bonus: selectedPackage.bonus.toString(),
        totalCredits: (selectedPackage.credits + selectedPackage.bonus).toString(),
      },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      automatic_tax: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'Los créditos se añadirán a tu cuenta inmediatamente después del pago exitoso.',
        },
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Compra de ${selectedPackage.name} - ${selectedPackage.credits + selectedPackage.bonus} AICredits`,
          metadata: {
            userId: session.user.id,
            packageId: selectedPackage.id,
          },
        },
      },
    })

    // Store pending transaction in database
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: session.user.id,
        type: 'purchase',
        amount: selectedPackage.credits + selectedPackage.bonus,
        description: `Compra de ${selectedPackage.name}`,
        status: 'pending',
        stripe_session_id: checkoutSession.id,
        metadata: {
          packageId: selectedPackage.id,
          credits: selectedPackage.credits,
          bonus: selectedPackage.bonus,
          price: selectedPackage.price,
        },
      })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}