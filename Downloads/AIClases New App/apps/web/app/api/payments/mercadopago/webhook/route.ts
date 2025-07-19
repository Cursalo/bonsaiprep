import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'
import { 
  getPaymentInfo, 
  validateWebhookSignature 
} from '@/lib/payments/mercadopago-client'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const xSignature = request.headers.get('x-signature') || ''
    const xRequestId = request.headers.get('x-request-id') || ''
    
    console.log('MercadoPago webhook received:', { body, xSignature, xRequestId })

    // Validate webhook signature
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data?.id || body.id
      )
      
      if (!isValidSignature) {
        console.error('Invalid MercadoPago webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Handle different notification types
    switch (body.type) {
      case 'payment':
        await handlePaymentNotification(body.data.id)
        break
      
      case 'merchant_order':
        await handleMerchantOrderNotification(body.data.id)
        break
      
      case 'plan':
        await handlePlanNotification(body.data.id)
        break
      
      case 'subscription':
        await handleSubscriptionNotification(body.data.id)
        break
      
      case 'invoice':
        await handleInvoiceNotification(body.data.id)
        break
      
      case 'point_integration_wh':
        // Point of sale integration webhook
        console.log('Point integration webhook:', body)
        break
      
      default:
        console.log('Unhandled MercadoPago notification type:', body.type)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    console.log('Processing payment notification:', paymentId)
    
    // Get payment information from MercadoPago
    const payment = await getPaymentInfo(paymentId)
    
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      externalReference: payment.external_reference,
      metadata: payment.metadata,
    })

    const userId = payment.external_reference
    const preferenceId = payment.preference_id
    
    if (!userId) {
      console.error('No user ID found in payment external_reference')
      return
    }

    // Find the transaction in our database
    const { data: transaction, error: findError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('mercadopago_preference_id', preferenceId)
      .eq('status', 'pending')
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', { userId, preferenceId, error: findError })
      return
    }

    // Update transaction based on payment status
    const updateData: any = {
      mercadopago_payment_id: payment.id,
      updated_at: new Date().toISOString(),
    }

    switch (payment.status) {
      case 'approved':
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        
        // Process the credit award
        await processCreditsAward(userId, transaction)
        
        console.log(`Payment approved for user ${userId}: ${transaction.amount} credits`)
        break
      
      case 'pending':
        updateData.status = 'pending'
        console.log(`Payment pending for user ${userId}`)
        break
      
      case 'rejected':
      case 'cancelled':
        updateData.status = 'failed'
        updateData.metadata = {
          ...transaction.metadata,
          failure_reason: payment.status_detail,
          mercadopago_status: payment.status,
        }
        console.log(`Payment ${payment.status} for user ${userId}: ${payment.status_detail}`)
        break
      
      default:
        console.log(`Unknown payment status: ${payment.status}`)
        return
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('credit_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
    }

  } catch (error) {
    console.error('Error processing payment notification:', error)
  }
}

async function processCreditsAward(userId: string, transaction: any) {
  try {
    // Get current user credits
    const { data: currentUser, error: userError } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user credits:', userError)
      throw userError
    }

    const newCreditsBalance = (currentUser?.credits || 0) + transaction.amount

    // Update user credits
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
        amount: transaction.amount,
        description: `Créditos añadidos por compra MercadoPago`,
        status: 'completed',
        metadata: {
          originalTransactionId: transaction.id,
          mercadopagoPaymentId: transaction.mercadopago_payment_id,
          packageId: transaction.metadata.packageId,
        },
      })

    if (awardError) {
      console.error('Error creating award transaction:', awardError)
      throw awardError
    }

    console.log(`Successfully awarded ${transaction.amount} credits to user ${userId}`)
  } catch (error) {
    console.error('Error processing credits award:', error)
    throw error
  }
}

async function handleMerchantOrderNotification(merchantOrderId: string) {
  try {
    console.log('Processing merchant order notification:', merchantOrderId)
    // Get merchant order details and process if needed
    // This is typically used for tracking order fulfillment
  } catch (error) {
    console.error('Error processing merchant order notification:', error)
  }
}

async function handlePlanNotification(planId: string) {
  try {
    console.log('Processing plan notification:', planId)
    // Handle subscription plan changes
  } catch (error) {
    console.error('Error processing plan notification:', error)
  }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  try {
    console.log('Processing subscription notification:', subscriptionId)
    // Handle subscription status changes
  } catch (error) {
    console.error('Error processing subscription notification:', error)
  }
}

async function handleInvoiceNotification(invoiceId: string) {
  try {
    console.log('Processing invoice notification:', invoiceId)
    // Handle invoice status changes for recurring payments
  } catch (error) {
    console.error('Error processing invoice notification:', error)
  }
}

// Disable body parsing for webhooks (but MercadoPago sends JSON)
export const runtime = 'nodejs'