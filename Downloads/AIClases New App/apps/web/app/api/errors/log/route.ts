import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url: string
  userAgent: string
  level: 'page' | 'component' | 'critical' | 'manual'
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorReport = await request.json()
    
    // Get user session if available (but don't require it for error logging)
    let userId: string | undefined
    try {
      const session = await getServerSession(authOptions)
      userId = session?.user?.id
    } catch (sessionError) {
      // Don't fail error logging if session check fails
      console.warn('Could not get session for error logging:', sessionError)
    }

    // Validate required fields
    const requiredFields = ['errorId', 'message', 'timestamp', 'url', 'level']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Prepare error log entry
    const errorLog = {
      error_id: body.errorId,
      message: body.message.slice(0, 1000), // Limit message length
      stack_trace: body.stack?.slice(0, 5000), // Limit stack trace length
      component_stack: body.componentStack?.slice(0, 2000),
      url: body.url.slice(0, 500),
      user_agent: body.userAgent?.slice(0, 500),
      error_level: body.level,
      user_id: userId || body.userId,
      session_id: body.sessionId,
      additional_data: body.additionalData || {},
      created_at: body.timestamp,
      resolved: false,
      occurrences: 1,
    }

    // Check if this error already exists (by message and stack trace hash)
    const errorHash = Buffer.from(`${body.message}${body.stack}`.slice(0, 1000)).toString('base64').slice(0, 50)
    
    const { data: existingError } = await supabase
      .from('error_logs')
      .select('id, occurrences')
      .eq('error_hash', errorHash)
      .single()

    if (existingError) {
      // Update existing error occurrence count
      await supabase
        .from('error_logs')
        .update({ 
          occurrences: existingError.occurrences + 1,
          last_occurred_at: body.timestamp,
        })
        .eq('id', existingError.id)
    } else {
      // Create new error log entry
      await supabase
        .from('error_logs')
        .insert({
          ...errorLog,
          error_hash: errorHash,
          first_occurred_at: body.timestamp,
          last_occurred_at: body.timestamp,
        })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Frontend Error Logged:', {
        errorId: body.errorId,
        message: body.message,
        level: body.level,
        url: body.url,
        userId,
      })
    }

    // For critical errors, you might want to send alerts
    if (body.level === 'critical') {
      // TODO: Implement critical error alerting (email, Slack, etc.)
      console.error('CRITICAL ERROR LOGGED:', body)
    }

    return NextResponse.json({ 
      success: true, 
      errorId: body.errorId,
      message: 'Error logged successfully' 
    })

  } catch (error) {
    console.error('Error logging API error:', error)
    
    // Don't fail completely if error logging fails
    return NextResponse.json(
      { 
        error: 'Failed to log error', 
        message: 'Error logging service is unavailable' 
      },
      { status: 500 }
    )
  }
}

// Get error logs for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (simplified check)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_admin')
      .eq('user_id', session.user.id)
      .single()

    if (!userProfile?.is_admin && !['admin', 'super_admin'].includes(userProfile?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const level = searchParams.get('level')
    const resolved = searchParams.get('resolved') === 'true'

    let query = supabase
      .from('error_logs')
      .select('*')
      .order('last_occurred_at', { ascending: false })
      .limit(limit)

    if (level) {
      query = query.eq('error_level', level)
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved)
    }

    const { data: errorLogs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      )
    }

    return NextResponse.json(errorLogs)

  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}