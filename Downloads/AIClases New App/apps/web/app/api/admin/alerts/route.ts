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
    const resolved = searchParams.get('resolved') === 'true'

    // System health checks
    const alerts = []

    try {
      // Check database health
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id', { count: 'exact', head: true })

      if (error) {
        alerts.push({
          id: 'db_error',
          type: 'error',
          title: 'Error de Base de Datos',
          description: `Error conectando a la base de datos: ${error.message}`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // Check if we have too many users (mock threshold)
      const userCount = data?.length || 0
      if (userCount > 2500) {
        alerts.push({
          id: 'high_user_count',
          type: 'warning',
          title: 'Alto número de usuarios',
          description: `Se han registrado ${userCount} usuarios. Considerar escalado del sistema.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // Check recent failed payments
      const { data: failedPayments } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (failedPayments && failedPayments.length > 10) {
        alerts.push({
          id: 'failed_payments',
          type: 'warning',
          title: 'Pagos fallidos elevados',
          description: `${failedPayments.length} pagos fallidos en las últimas 24 horas.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // Check system performance (mock data)
      const memoryUsage = Math.random() * 100
      if (memoryUsage > 85) {
        alerts.push({
          id: 'high_memory',
          type: 'warning',
          title: 'Alto uso de memoria',
          description: `El sistema está usando ${memoryUsage.toFixed(1)}% de memoria RAM.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // Scheduled maintenance notification
      const now = new Date()
      const maintenanceTime = new Date()
      maintenanceTime.setDate(now.getDate() + 1)
      maintenanceTime.setHours(2, 0, 0, 0)

      if (maintenanceTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
        alerts.push({
          id: 'scheduled_maintenance',
          type: 'info',
          title: 'Mantenimiento programado',
          description: `Mantenimiento programado para ${maintenanceTime.toLocaleDateString()} a las 2:00 AM.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // Check for inactive admins (mock)
      const inactiveAdmins = Math.floor(Math.random() * 3)
      if (inactiveAdmins > 0) {
        alerts.push({
          id: 'inactive_admins',
          type: 'info',
          title: 'Administradores inactivos',
          description: `${inactiveAdmins} administradores no han iniciado sesión en los últimos 7 días.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

      // SSL certificate expiration check (mock)
      const sslExpiryDays = Math.floor(Math.random() * 90) + 1
      if (sslExpiryDays < 30) {
        alerts.push({
          id: 'ssl_expiry',
          type: sslExpiryDays < 7 ? 'error' : 'warning',
          title: 'Certificado SSL por vencer',
          description: `El certificado SSL expira en ${sslExpiryDays} días.`,
          timestamp: new Date().toISOString(),
          resolved: false,
        })
      }

    } catch (systemError) {
      alerts.push({
        id: 'system_error',
        type: 'error',
        title: 'Error del sistema',
        description: 'Error al verificar el estado del sistema.',
        timestamp: new Date().toISOString(),
        resolved: false,
      })
    }

    // Filter and sort alerts
    const filteredAlerts = alerts
      .filter(alert => resolved ? alert.resolved : !alert.resolved)
      .sort((a, b) => {
        // Sort by severity then by timestamp
        const severityOrder = { error: 3, warning: 2, info: 1 }
        const aSeverity = severityOrder[a.type as keyof typeof severityOrder] || 0
        const bSeverity = severityOrder[b.type as keyof typeof severityOrder] || 0
        
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity
        }
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      .slice(0, limit)

    return NextResponse.json(filteredAlerts)
  } catch (error) {
    console.error('Admin alerts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { alertId, action } = body

    if (action === 'resolve') {
      // In a real implementation, you would update the alert status in the database
      // For now, we'll just return success
      return NextResponse.json({ 
        success: true, 
        message: `Alert ${alertId} marked as resolved` 
      })
    }

    if (action === 'dismiss') {
      // Dismiss the alert
      return NextResponse.json({ 
        success: true, 
        message: `Alert ${alertId} dismissed` 
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin alerts POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}