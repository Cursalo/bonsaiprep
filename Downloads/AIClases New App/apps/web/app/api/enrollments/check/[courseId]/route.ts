import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId } = params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if user is enrolled in the course
    const { data: enrollment, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('course_id', courseId)
      .eq('refunded', false)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking enrollment:', error)
      return NextResponse.json(
        { error: 'Failed to check enrollment' },
        { status: 500 }
      )
    }

    const enrolled = !!enrollment
    
    // If enrolled, also get progress information
    let progress = null
    if (enrolled) {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('course_id', courseId)
        .single()
      
      progress = progressData
    }

    return NextResponse.json({
      enrolled,
      enrollment: enrollment || null,
      progress: progress || null,
    })
  } catch (error) {
    console.error('Enrollment check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}