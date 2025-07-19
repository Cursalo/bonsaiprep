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

    const { amount, transaction_type, metadata } = await request.json()

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

    // Start a transaction
    const { data, error } = await supabase.rpc('award_credits', {
      p_user_id: session.user.id,
      p_amount: amount,
      p_transaction_type: transaction_type,
      p_metadata: metadata || {},
    })

    if (error) {
      console.error('Error awarding credits:', error)
      return NextResponse.json(
        { error: 'Failed to award credits' },
        { status: 500 }
      )
    }

    // Create notification for credit award
    await supabase
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title: '¡Créditos ganados! 🎉',
        message: `Has ganado ${amount} créditos por ${transaction_type.replace('_', ' ')}`,
        type: 'credit',
        metadata: {
          credits_awarded: amount,
          transaction_type,
          ...metadata,
        },
      })

    return NextResponse.json({
      success: true,
      credits_awarded: amount,
    })
  } catch (error) {
    console.error('Award credits API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}