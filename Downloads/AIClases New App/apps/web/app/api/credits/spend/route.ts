import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    const { amount, transaction_type, reference_id, metadata } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!transaction_type) {
      return NextResponse.json(
        { error: 'Transaction type is required' },
        { status: 400 }
      )
    }

    // Check current balance first
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', session.user.id)
      .single()

    if (creditsError || !userCredits) {
      return NextResponse.json(
        { error: 'Could not fetch user credits' },
        { status: 500 }
      )
    }

    if (userCredits.current_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      )
    }

    // Deduct credits using stored procedure
    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: session.user.id,
      p_amount: amount,
      p_transaction_type: transaction_type,
      p_metadata: {
        reference_id,
        ...metadata,
      },
    })

    if (error) {
      console.error('Error spending credits:', error)
      return NextResponse.json(
        { error: 'Failed to spend credits' },
        { status: 500 }
      )
    }

    // Create notification for credit expenditure
    await supabase
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title: 'Créditos utilizados',
        message: `Has gastado ${amount} créditos en ${transaction_type.replace('_', ' ')}`,
        type: 'credit',
        metadata: {
          credits_spent: amount,
          transaction_type,
          reference_id,
          ...metadata,
        },
      })

    return NextResponse.json({
      success: true,
      credits_spent: amount,
      remaining_balance: userCredits.current_balance - amount,
    })
  } catch (error) {
    console.error('Spend credits API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}