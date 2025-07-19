import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { checkAdminRole } from '@/lib/auth/admin-utils'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin - AIClases 4.0',
    default: 'Admin - AIClases 4.0',
  },
  description: 'Panel de administración de AIClases',
  robots: {
    index: false,
    follow: false,
  },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  // Check admin privileges
  const isAdmin = await checkAdminRole(session.user.id)
  
  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader user={session.user} />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}