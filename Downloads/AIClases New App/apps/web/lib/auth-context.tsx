'use client'

import { createContext, useContext, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

interface AuthContextType {
  // Additional auth-related functions can be added here
}

const AuthContext = createContext<AuthContextType>({})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <AuthContext.Provider value={{}}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}