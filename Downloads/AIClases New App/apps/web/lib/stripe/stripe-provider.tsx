'use client'

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { createContext, useContext, ReactNode } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeContextType {
  stripe: Promise<Stripe | null>
}

const StripeContext = createContext<StripeContextType | undefined>(undefined)

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <StripeContext.Provider value={{ stripe: stripePromise }}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export function useStripe() {
  const context = useContext(StripeContext)
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider')
  }
  return context
}