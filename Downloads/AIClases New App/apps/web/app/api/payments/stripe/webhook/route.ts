import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe-client'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'
import Stripe from 'stripe'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const packageId = session.metadata?.packageId
  const credits = parseInt(session.metadata?.credits || '0')
  const bonus = parseInt(session.metadata?.bonus || '0')
  const totalCredits = credits + bonus

  if (!userId || !packageId) {
    console.error('Missing required metadata in checkout session:', session.id)
    return
  }

  // Update transaction status to completed
  const { error: updateError } = await supabase
    .from('credit_transactions')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', session.id)
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating transaction:', updateError)
    throw updateError
  }

  // Add credits to user account
  const { data: currentUser, error: userError } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('user_id', userId)
    .single()

  if (userError) {
    console.error('Error fetching user credits:', userError)
    throw userError
  }

  const newCreditsBalance = (currentUser?.credits || 0) + totalCredits

  const { error: creditsError } = await supabase
    .from('user_profiles')
    .update({ credits: newCreditsBalance })
    .eq('user_id', userId)

  if (creditsError) {
    console.error('Error updating user credits:', creditsError)
    throw creditsError
  }

  // Create credit award transaction
  const { error: awardError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'award',
      amount: totalCredits,
      description: `Créditos añadidos por compra de ${packageId}`,
      status: 'completed',
      metadata: {
        packageId,
        purchaseSessionId: session.id,
        baseCredits: credits,
        bonusCredits: bonus,
      },
    })

  if (awardError) {
    console.error('Error creating award transaction:', awardError)
    throw awardError
  }

  // Send confirmation email (optional)
  await sendPurchaseConfirmationEmail(userId, packageId, totalCredits)

  console.log(`Successfully processed credit purchase for user ${userId}: ${totalCredits} credits`)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  // Additional payment success logic if needed
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
  
  // Update any pending transactions to failed
  const { error } = await supabase
    .from('credit_transactions')
    .update({
      status: 'failed',
      metadata: {
        error: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating failed payment transaction:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) {
    console.error('Missing userId in customer metadata for subscription:', subscription.id)
    return
  }

  // Create subscription record
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      metadata: {
        priceId: subscription.items.data[0]?.price.id,
        productId: subscription.items.data[0]?.price.product,
      },
    })

  if (error) {
    console.error('Error creating subscription record:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating canceled subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Handle recurring subscription payment
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    // Add monthly credits for subscription users
    await addSubscriptionCredits(subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id)
  // Handle failed subscription payment
}

async function addSubscriptionCredits(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) return

  // Add monthly subscription credits (e.g., 1000 credits per month)
  const monthlyCredits = 1000
  
  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('user_id', userId)
    .single()

  const newCreditsBalance = (currentUser?.credits || 0) + monthlyCredits

  await supabase
    .from('user_profiles')
    .update({ credits: newCreditsBalance })
    .eq('user_id', userId)

  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'subscription',
      amount: monthlyCredits,
      description: 'Créditos mensuales de suscripción',
      status: 'completed',
      metadata: {
        subscriptionId: subscription.id,
        period: new Date().toISOString(),
      },
    })
}

async function sendPurchaseConfirmationEmail(userId: string, packageId: string, credits: number) {
  // TODO: Implement email sending logic
  // This could use Resend, SendGrid, or another email service
  console.log(`Should send confirmation email to user ${userId} for ${credits} credits`)
}

// Disable body parsing for webhooks
export const runtime = 'nodejs'