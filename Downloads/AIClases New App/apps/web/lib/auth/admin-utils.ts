import { createClient } from '@supabase/supabase-js'
import { Database } from '@database/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'content_manager'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: string[]
  created_at: string
  last_login: string | null
}

// Check if user has admin role
export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_admin')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.is_admin === true || ['super_admin', 'admin', 'moderator', 'content_manager'].includes(data.role)
  } catch (error) {
    console.error('Error checking admin role:', error)
    return false
  }
}

// Get admin user details
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        full_name,
        role,
        is_admin,
        created_at,
        last_login_at,
        metadata
      `)
      .eq('user_id', userId)
      .eq('is_admin', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.user_id,
      email: data.email || '',
      name: data.full_name || '',
      role: data.role as AdminRole,
      permissions: data.metadata?.permissions || [],
      created_at: data.created_at,
      last_login: data.last_login_at,
    }
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

// Check specific permission
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const adminUser = await getAdminUser(userId)
    if (!adminUser) return false

    // Super admins have all permissions
    if (adminUser.role === 'super_admin') return true

    // Check specific permissions
    return adminUser.permissions.includes(permission)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

// Admin permissions mapping
export const ADMIN_PERMISSIONS = {
  // Course Management
  'courses.create': 'Create new courses',
  'courses.edit': 'Edit existing courses',
  'courses.delete': 'Delete courses',
  'courses.publish': 'Publish/unpublish courses',
  'courses.view_analytics': 'View course analytics',
  
  // User Management
  'users.create': 'Create new users',
  'users.edit': 'Edit user profiles',
  'users.delete': 'Delete users',
  'users.ban': 'Ban/unban users',
  'users.view_details': 'View user details',
  'users.impersonate': 'Impersonate users',
  
  // Content Management
  'content.create': 'Create content',
  'content.edit': 'Edit content',
  'content.delete': 'Delete content',
  'content.moderate': 'Moderate user content',
  
  // Financial Management
  'finance.view_transactions': 'View financial transactions',
  'finance.process_refunds': 'Process refunds',
  'finance.view_reports': 'View financial reports',
  
  // System Management
  'system.view_logs': 'View system logs',
  'system.manage_settings': 'Manage system settings',
  'system.backup': 'Create system backups',
  'system.monitor': 'Monitor system health',
  
  // Analytics
  'analytics.view_all': 'View all analytics',
  'analytics.export': 'Export analytics data',
  
  // Support
  'support.view_tickets': 'View support tickets',
  'support.respond': 'Respond to support tickets',
} as const

// Role-based permissions
export const ROLE_PERMISSIONS: Record<AdminRole, (keyof typeof ADMIN_PERMISSIONS)[]> = {
  super_admin: Object.keys(ADMIN_PERMISSIONS) as (keyof typeof ADMIN_PERMISSIONS)[],
  
  admin: [
    'courses.create', 'courses.edit', 'courses.delete', 'courses.publish', 'courses.view_analytics',
    'users.create', 'users.edit', 'users.ban', 'users.view_details',
    'content.create', 'content.edit', 'content.delete', 'content.moderate',
    'finance.view_transactions', 'finance.view_reports',
    'analytics.view_all', 'analytics.export',
    'support.view_tickets', 'support.respond',
  ],
  
  moderator: [
    'courses.edit', 'courses.view_analytics',
    'users.view_details', 'users.ban',
    'content.edit', 'content.moderate',
    'support.view_tickets', 'support.respond',
  ],
  
  content_manager: [
    'courses.create', 'courses.edit', 'courses.publish', 'courses.view_analytics',
    'content.create', 'content.edit', 'content.delete',
  ],
}

// Admin activity logging
export async function logAdminActivity(
  userId: string,
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: userId,
        action,
        details,
        ip_address: null, // Will be filled by edge function if needed
        user_agent: null, // Will be filled by edge function if needed
      })
  } catch (error) {
    console.error('Error logging admin activity:', error)
  }
}

// Get admin dashboard stats
export async function getAdminDashboardStats() {
  try {
    const [
      totalUsersResult,
      totalCoursesResult,
      totalEnrollmentsResult,
      revenueResult,
      activeUsersResult,
    ] = await Promise.all([
      supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('credit_transactions')
        .select('amount, metadata')
        .eq('type', 'purchase')
        .eq('status', 'completed'),
      supabase.from('user_profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const totalRevenue = revenueResult.data?.reduce((sum, transaction) => {
      const price = transaction.metadata?.price || 0
      return sum + price
    }, 0) || 0

    return {
      totalUsers: totalUsersResult.count || 0,
      totalCourses: totalCoursesResult.count || 0,
      totalEnrollments: totalEnrollmentsResult.count || 0,
      totalRevenue,
      activeUsers: activeUsersResult.count || 0,
    }
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error)
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      totalRevenue: 0,
      activeUsers: 0,
    }
  }
}

// Course management functions
export async function getCourses(
  page: number = 1,
  limit: number = 20,
  filters: {
    status?: 'published' | 'draft' | 'archived'
    search?: string
    category?: string
  } = {}
) {
  try {
    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        instructor_id,
        user_profiles!instructor_id (
          full_name,
          email
        ),
        course_enrollments (
          id
        )
      `)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      courses: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    console.error('Error getting courses:', error)
    throw error
  }
}

// User management functions
export async function getUsers(
  page: number = 1,
  limit: number = 20,
  filters: {
    role?: string
    status?: 'active' | 'banned' | 'pending'
    search?: string
  } = {}
) {
  try {
    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        full_name,
        role,
        is_admin,
        created_at,
        last_login_at,
        credits,
        metadata,
        course_enrollments (
          id
        )
      `)

    if (filters.role) {
      query = query.eq('role', filters.role)
    }

    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      users: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    console.error('Error getting users:', error)
    throw error
  }
}

// Validate admin session
export async function validateAdminSession(userId: string): Promise<boolean> {
  const isAdmin = await checkAdminRole(userId)
  
  if (isAdmin) {
    // Update last activity
    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId)
  }
  
  return isAdmin
}