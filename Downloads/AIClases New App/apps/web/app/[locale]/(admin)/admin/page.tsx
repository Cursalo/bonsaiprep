import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { checkAdminRole } from '@/lib/auth/admin-utils'

export const metadata: Metadata = {
  title: 'Panel de Administración | AIClases 4.0',
  description: 'Panel de control administrativo para gestión de cursos, usuarios y contenido',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  // Check if user has admin privileges
  const isAdmin = await checkAdminRole(session.user.id)
  
  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <AdminDashboard userId={session.user.id} />
    </div>
  )
}