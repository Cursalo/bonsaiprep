import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAdminRole } from '@/lib/auth/admin-utils'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // Filter by activity type

    // Get recent user registrations
    const { data: newUsers } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent enrollments
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        created_at,
        user_id,
        course_id,
        user_profiles!inner (
          full_name,
          email
        ),
        courses!inner (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent payments
    const { data: payments } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        created_at,
        user_id,
        amount,
        description,
        metadata,
        user_profiles!inner (
          full_name,
          email
        )
      `)
      .eq('type', 'purchase')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent course completions (mock data for now)
    const { data: completions } = await supabase
      .from('user_progress')
      .select(`
        id,
        updated_at,
        user_id,
        course_id,
        progress,
        user_profiles!inner (
          full_name,
          email
        ),
        courses!inner (
          title
        )
      `)
      .eq('progress', 100)
      .order('updated_at', { ascending: false })
      .limit(5)

    // Combine and format activities
    const activities = []

    // Add user registrations
    newUsers?.forEach(user => {
      activities.push({
        id: `user_${user.user_id}`,
        type: 'user_registration',
        user: user.full_name || user.email || 'Usuario desconocido',
        description: 'Se registró un nuevo usuario',
        timestamp: user.created_at,
      })
    })

    // Add enrollments
    enrollments?.forEach(enrollment => {
      activities.push({
        id: `enrollment_${enrollment.id}`,
        type: 'course_enrollment',
        user: enrollment.user_profiles.full_name || enrollment.user_profiles.email || 'Usuario desconocido',
        description: `Se inscribió en "${enrollment.courses.title}"`,
        timestamp: enrollment.created_at,
      })
    })

    // Add payments
    payments?.forEach(payment => {
      const packageName = payment.metadata?.packageId || 'créditos'
      const price = payment.metadata?.price || 0
      activities.push({
        id: `payment_${payment.id}`,
        type: 'payment',
        user: payment.user_profiles.full_name || payment.user_profiles.email || 'Usuario desconocido',
        description: `Compró ${packageName}`,
        timestamp: payment.created_at,
        amount: price,
      })
    })

    // Add completions
    completions?.forEach(completion => {
      activities.push({
        id: `completion_${completion.id}`,
        type: 'course_completion',
        user: completion.user_profiles.full_name || completion.user_profiles.email || 'Usuario desconocido',
        description: `Completó "${completion.courses.title}"`,
        timestamp: completion.updated_at,
      })
    })

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    // Filter by type if specified
    const filteredActivities = type 
      ? sortedActivities.filter(activity => activity.type === type)
      : sortedActivities

    return NextResponse.json(filteredActivities)
  } catch (error) {
    console.error('Admin activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}