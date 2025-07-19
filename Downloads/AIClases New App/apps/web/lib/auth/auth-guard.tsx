'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@aiclases/ui'

interface AuthGuardProps {
  children: React.ReactNode
  mode: 'protected' | 'guest'
}

export function AuthGuard({ children, mode }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (mode === 'protected' && !session) {
      router.push('/login')
    }

    if (mode === 'guest' && session) {
      router.push('/courses')
    }
  }, [session, status, mode, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (mode === 'protected' && !session) {
    return null
  }

  if (mode === 'guest' && session) {
    return null
  }

  return <>{children}</>
}