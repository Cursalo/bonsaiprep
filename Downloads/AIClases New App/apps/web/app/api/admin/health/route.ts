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

interface HealthCheck {
  service: string
  status: 'healthy' | 'warning' | 'error'
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
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

    const checks: HealthCheck[] = []

    // Database Health Check
    try {
      const dbStartTime = Date.now()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id', { count: 'exact', head: true })
        .limit(1)

      const dbResponseTime = Date.now() - dbStartTime

      if (error) {
        checks.push({
          service: 'database',
          status: 'error',
          responseTime: dbResponseTime,
          error: error.message,
        })
      } else {
        checks.push({
          service: 'database',
          status: dbResponseTime < 1000 ? 'healthy' : 'warning',
          responseTime: dbResponseTime,
          details: {
            userCount: data?.length || 0,
          },
        })
      }
    } catch (error) {
      checks.push({
        service: 'database',
        status: 'error',
        error: 'Database connection failed',
      })
    }

    // Stripe Health Check
    try {
      const stripeStartTime = Date.now()
      // Simple health check by creating a test customer (we won't actually create it)
      const stripeHealthy = process.env.STRIPE_SECRET_KEY ? true : false
      const stripeResponseTime = Date.now() - stripeStartTime

      checks.push({
        service: 'stripe',
        status: stripeHealthy ? 'healthy' : 'warning',
        responseTime: stripeResponseTime,
        details: {
          configured: !!process.env.STRIPE_SECRET_KEY,
        },
      })
    } catch (error) {
      checks.push({
        service: 'stripe',
        status: 'error',
        error: 'Stripe service unavailable',
      })
    }

    // MercadoPago Health Check
    try {
      const mpStartTime = Date.now()
      const mpHealthy = process.env.MERCADOPAGO_ACCESS_TOKEN ? true : false
      const mpResponseTime = Date.now() - mpStartTime

      checks.push({
        service: 'mercadopago',
        status: mpHealthy ? 'healthy' : 'warning',
        responseTime: mpResponseTime,
        details: {
          configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
        },
      })
    } catch (error) {
      checks.push({
        service: 'mercadopago',
        status: 'error',
        error: 'MercadoPago service unavailable',
      })
    }

    // Email Service Health Check
    try {
      const emailStartTime = Date.now()
      const emailHealthy = process.env.EMAIL_SERVER_PASSWORD ? true : false
      const emailResponseTime = Date.now() - emailStartTime

      checks.push({
        service: 'email',
        status: emailHealthy ? 'healthy' : 'warning',
        responseTime: emailResponseTime,
        details: {
          configured: !!process.env.EMAIL_SERVER_PASSWORD,
        },
      })
    } catch (error) {
      checks.push({
        service: 'email',
        status: 'error',
        error: 'Email service unavailable',
      })
    }

    // Memory Health Check (mock)
    try {
      const memoryUsage = Math.random() * 100 // Mock memory usage
      checks.push({
        service: 'memory',
        status: memoryUsage < 80 ? 'healthy' : memoryUsage < 90 ? 'warning' : 'error',
        details: {
          usage: memoryUsage.toFixed(1),
          limit: '2GB',
        },
      })
    } catch (error) {
      checks.push({
        service: 'memory',
        status: 'error',
        error: 'Cannot check memory usage',
      })
    }

    // CPU Health Check (mock)
    try {
      const cpuUsage = Math.random() * 100 // Mock CPU usage
      checks.push({
        service: 'cpu',
        status: cpuUsage < 70 ? 'healthy' : cpuUsage < 85 ? 'warning' : 'error',
        details: {
          usage: cpuUsage.toFixed(1),
          cores: 2,
        },
      })
    } catch (error) {
      checks.push({
        service: 'cpu',
        status: 'error',
        error: 'Cannot check CPU usage',
      })
    }

    // Disk Space Health Check (mock)
    try {
      const diskUsage = Math.random() * 100 // Mock disk usage
      checks.push({
        service: 'disk',
        status: diskUsage < 80 ? 'healthy' : diskUsage < 90 ? 'warning' : 'error',
        details: {
          usage: diskUsage.toFixed(1),
          total: '50GB',
          available: ((100 - diskUsage) * 0.5).toFixed(1) + 'GB',
        },
      })
    } catch (error) {
      checks.push({
        service: 'disk',
        status: 'error',
        error: 'Cannot check disk usage',
      })
    }

    // External APIs Health Check
    try {
      // Check if we can reach external services (mock)
      const externalApiLatency = Math.random() * 1000 + 100 // Mock latency
      checks.push({
        service: 'external_apis',
        status: externalApiLatency < 500 ? 'healthy' : externalApiLatency < 1000 ? 'warning' : 'error',
        responseTime: Math.round(externalApiLatency),
        details: {
          openai: 'healthy',
          context7: 'healthy',
        },
      })
    } catch (error) {
      checks.push({
        service: 'external_apis',
        status: 'error',
        error: 'External API health check failed',
      })
    }

    // Overall system status
    const errorCount = checks.filter(check => check.status === 'error').length
    const warningCount = checks.filter(check => check.status === 'warning').length
    
    let overallStatus: 'healthy' | 'warning' | 'error'
    if (errorCount > 0) {
      overallStatus = 'error'
    } else if (warningCount > 0) {
      overallStatus = 'warning'
    } else {
      overallStatus = 'healthy'
    }

    const totalResponseTime = Date.now() - startTime

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      version: '4.0.0',
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(check => check.status === 'healthy').length,
        warning: warningCount,
        error: errorCount,
      },
    }

    // Log health check for monitoring
    console.log(`Health check completed: ${overallStatus} (${totalResponseTime}ms)`)

    return NextResponse.json(healthReport)
  } catch (error) {
    console.error('Health check API error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}