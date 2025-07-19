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

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    })

    // Verify session belongs to current user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching transaction:', error)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Return session details
    return NextResponse.json({
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        amount_total: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        customer_email: checkoutSession.customer_details?.email,
        created: new Date(checkoutSession.created * 1000).toISOString(),
      },
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        description: transaction.description,
        created_at: transaction.created_at,
        completed_at: transaction.completed_at,
        metadata: transaction.metadata,
      },
      payment_intent: checkoutSession.payment_intent ? {
        id: (checkoutSession.payment_intent as any).id,
        status: (checkoutSession.payment_intent as any).status,
        amount: (checkoutSession.payment_intent as any).amount,
        currency: (checkoutSession.payment_intent as any).currency,
      } : null,
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}