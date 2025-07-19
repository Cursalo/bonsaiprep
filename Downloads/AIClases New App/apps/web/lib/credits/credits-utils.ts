import { supabaseAdmin } from '@aiclases/database'

export async function checkDailyLimit(userId: string, actionType: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: userSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('subscription_type')
    .eq('user_id', userId)
    .eq('active', true)
    .single()

  const subscription = userSubscription?.subscription_type || 'free'
  
  const limits = {
    free: { mentor_questions: 5 },
    course: { mentor_questions: 20 },
    plus: { mentor_questions: 100 }
  }

  const { data: usageToday } = await supabaseAdmin
    .from('daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .eq('date', today)
    .single()

  const used = usageToday?.count || 0
  const limit = limits[subscription][actionType] || 0
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    subscription
  }
}

export async function deductCredits(
  userId: string, 
  amount: number, 
  metadata: { type: string; description: string }
) {
  const { data: currentCredits } = await supabaseAdmin
    .from('user_credits')
    .select('current_balance')
    .eq('user_id', userId)
    .single()

  if (!currentCredits || currentCredits.current_balance < amount) {
    return false
  }

  const { error } = await supabaseAdmin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_transaction_type: metadata.type,
    p_metadata: metadata
  })

  return !error
}

export async function awardCredits(
  userId: string,
  amount: number,
  metadata: { type: string; description: string }
) {
  const { error } = await supabaseAdmin.rpc('award_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_transaction_type: metadata.type,
    p_metadata: metadata
  })

  return !error
}

export function calculateLevel(totalCredits: number): number {
  return Math.floor(Math.sqrt(totalCredits / 100)) + 1
}

export function creditsToNextLevel(currentCredits: number): number {
  const currentLevel = calculateLevel(currentCredits)
  const nextLevelCredits = (currentLevel * currentLevel) * 100
  return Math.max(0, nextLevelCredits - currentCredits)
}