'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export interface CreditTransaction {
  id: string
  amount: number
  transaction_type: string
  reference_id?: string
  metadata?: any
  created_at: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  bonus: number
  price: number
  popular?: boolean
}

export function useCredits() {
  const { user, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const currentBalance = user?.credits || 0
  const currentLevel = user?.level || 1

  // Award credits to user
  const awardCredits = useCallback(async (
    amount: number,
    transactionType: string,
    metadata?: any
  ): Promise<boolean> => {
    if (!user) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/credits/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          transaction_type: transactionType,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to award credits')
      }

      const result = await response.json()
      await refreshSession()
      
      toast.success(`¡Has ganado ${amount} créditos! 🎉`, {
        description: `Nuevo balance: ${currentBalance + amount} créditos`,
      })

      return result.success
    } catch (error) {
      console.error('Error awarding credits:', error)
      toast.error('Error al otorgar créditos')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, currentBalance, refreshSession])

  // Deduct credits from user
  const spendCredits = useCallback(async (
    amount: number,
    transactionType: string,
    referenceId?: string,
    metadata?: any
  ): Promise<boolean> => {
    if (!user) return false

    if (currentBalance < amount) {
      toast.error('Créditos insuficientes', {
        description: `Necesitas ${amount} créditos pero tienes ${currentBalance}`,
        action: {
          label: 'Comprar créditos',
          onClick: () => window.location.href = '/credits',
        },
      })
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          transaction_type: transactionType,
          reference_id: referenceId,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to spend credits')
      }

      const result = await response.json()
      await refreshSession()
      
      toast.success(`${amount} créditos utilizados`, {
        description: `Nuevo balance: ${currentBalance - amount} créditos`,
      })

      return result.success
    } catch (error) {
      console.error('Error spending credits:', error)
      toast.error('Error al gastar créditos')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, currentBalance, refreshSession])

  // Get credit transaction history
  const getTransactionHistory = useCallback(async (
    limit: number = 50,
    offset: number = 0
  ): Promise<CreditTransaction[]> => {
    if (!user) return []

    try {
      const response = await fetch(
        `/api/credits/transactions?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const { transactions } = await response.json()
      return transactions
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }, [user])

  // Purchase credits with payment
  const purchaseCredits = useCallback(async (
    packageId: string,
    paymentMethodId: string
  ): Promise<boolean> => {
    if (!user) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: packageId,
          payment_method_id: paymentMethodId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to purchase credits')
      }

      const result = await response.json()
      
      if (result.success) {
        await refreshSession()
        toast.success('¡Compra exitosa! 🎉', {
          description: `Has recibido ${result.credits_purchased} créditos`,
        })
        return true
      } else {
        toast.error('Error en la compra', {
          description: result.error || 'Intenta nuevamente',
        })
        return false
      }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast.error('Error al procesar la compra')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, refreshSession])

  // Check if user can afford something
  const canAfford = useCallback((amount: number): boolean => {
    return currentBalance >= amount
  }, [currentBalance])

  // Get available credit packages
  const getCreditPackages = useCallback(async (): Promise<CreditPackage[]> => {
    try {
      const response = await fetch('/api/credits/packages', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }

      const { packages } = await response.json()
      return packages
    } catch (error) {
      console.error('Error fetching credit packages:', error)
      return []
    }
  }, [])

  // Award completion credits for lessons/courses
  const awardCompletionCredits = useCallback(async (
    type: 'lesson' | 'course',
    id: string,
    title: string
  ): Promise<boolean> => {
    const amounts = {
      lesson: 10,
      course: 100,
    }

    const amount = amounts[type]
    
    return await awardCredits(
      amount,
      `${type}_completion`,
      {
        [type === 'lesson' ? 'lesson_id' : 'course_id']: id,
        title,
      }
    )
  }, [awardCredits])

  // Award referral credits
  const awardReferralCredits = useCallback(async (
    referredUserId: string,
    referredUserName: string
  ): Promise<boolean> => {
    return await awardCredits(
      200,
      'referral_bonus',
      {
        referred_user_id: referredUserId,
        referred_user_name: referredUserName,
      }
    )
  }, [awardCredits])

  // Award daily streak credits
  const awardStreakCredits = useCallback(async (
    streakDays: number
  ): Promise<boolean> => {
    const bonusAmount = Math.min(streakDays * 5, 100) // Max 100 credits
    
    return await awardCredits(
      bonusAmount,
      'daily_streak',
      {
        streak_days: streakDays,
      }
    )
  }, [awardCredits])

  return {
    currentBalance,
    currentLevel,
    isLoading,
    awardCredits,
    spendCredits,
    purchaseCredits,
    canAfford,
    getTransactionHistory,
    getCreditPackages,
    awardCompletionCredits,
    awardReferralCredits,
    awardStreakCredits,
  }
}