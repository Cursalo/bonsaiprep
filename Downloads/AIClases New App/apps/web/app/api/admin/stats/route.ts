import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAdminRole, getAdminDashboardStats } from '@/lib/auth/admin-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin privileges
    const isAdmin = await checkAdminRole(session.user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const stats = await getAdminDashboardStats()

    // Add additional calculated metrics
    const enrichedStats = {
      ...stats,
      newUsersToday: Math.floor(Math.random() * 50) + 10, // Mock data - replace with real query
      completionRate: ((stats.totalEnrollments / stats.totalCourses) * 0.8).toFixed(1),
      avgSessionTime: Math.floor(Math.random() * 60) + 30, // Mock data
      growthRate: ((stats.totalUsers / 100) * 0.15).toFixed(1), // Mock 15% growth
    }

    return NextResponse.json(enrichedStats)
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}