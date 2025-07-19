'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { supabaseBrowser } from '@aiclases/database'

interface CreditsContextType {
  balance: number
  totalEarned: number
  level: number
  loading: boolean
  refreshCredits: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)

  const refreshCredits = async () => {
    if (!session?.user?.id) return

    try {
      const { data } = await supabaseBrowser
        .from('user_credits')
        .select('current_balance, total_earned, level')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setBalance(data.current_balance)
        setTotalEarned(data.total_earned)
        setLevel(data.level)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCredits()

    if (session?.user?.id) {
      const channel = supabaseBrowser
        .channel('user_credits_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            refreshCredits()
          }
        )
        .subscribe()

      return () => {
        supabaseBrowser.removeChannel(channel)
      }
    }
  }, [session?.user?.id])

  return (
    <CreditsContext.Provider
      value={{
        balance,
        totalEarned,
        level,
        loading,
        refreshCredits
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}