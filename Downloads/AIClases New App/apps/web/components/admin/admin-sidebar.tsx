'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@ui/utils'
import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { ScrollArea } from '@ui/components/scroll-area'
import { Separator } from '@ui/components/separator'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Bell,
  Database,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageSquare,
  Package,
  Webhook,
  Eye,
  Lock,
} from 'lucide-react'

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Vista general del sistema',
  },
  {
    title: 'Cursos',
    href: '/admin/courses',
    icon: BookOpen,
    description: 'Gestión de cursos y contenido',
    children: [
      { title: 'Todos los Cursos', href: '/admin/courses', icon: BookOpen },
      { title: 'Crear Curso', href: '/admin/courses/create', icon: Package },
      { title: 'Categorías', href: '/admin/courses/categories', icon: FileText },
      { title: 'Evaluaciones', href: '/admin/courses/assessments', icon: Shield },
    ],
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: Users,
    description: 'Gestión de usuarios y roles',
    children: [
      { title: 'Todos los Usuarios', href: '/admin/users', icon: Users },
      { title: 'Administradores', href: '/admin/users/admins', icon: Shield },
      { title: 'Instructores', href: '/admin/users/instructors', icon: Eye },
      { title: 'Estudiantes', href: '/admin/users/students', icon: Users },
    ],
  },
  {
    title: 'Finanzas',
    href: '/admin/finance',
    icon: CreditCard,
    badge: 'nuevo',
    description: 'Transacciones y reportes financieros',
    children: [
      { title: 'Transacciones', href: '/admin/finance/transactions', icon: CreditCard },
      { title: 'Reembolsos', href: '/admin/finance/refunds', icon: CreditCard },
      { title: 'Reportes', href: '/admin/finance/reports', icon: BarChart3 },
      { title: 'Webhooks', href: '/admin/finance/webhooks', icon: Webhook },
    ],
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Métricas y análisis de datos',
    children: [
      { title: 'Usuarios', href: '/admin/analytics/users', icon: Users },
      { title: 'Cursos', href: '/admin/analytics/courses', icon: BookOpen },
      { title: 'Ingresos', href: '/admin/analytics/revenue', icon: CreditCard },
      { title: 'Engagement', href: '/admin/analytics/engagement', icon: Activity },
    ],
  },
  {
    title: 'Contenido',
    href: '/admin/content',
    icon: FileText,
    description: 'Gestión de contenido y recursos',
    children: [
      { title: 'Recursos', href: '/admin/content/resources', icon: FileText },
      { title: 'Moderación', href: '/admin/content/moderation', icon: Shield },
      { title: 'Comentarios', href: '/admin/content/comments', icon: MessageSquare },
    ],
  },
  {
    title: 'Sistema',
    href: '/admin/system',
    icon: Database,
    description: 'Configuración y monitoreo',
    children: [
      { title: 'Configuración', href: '/admin/system/settings', icon: Settings },
      { title: 'Logs', href: '/admin/system/logs', icon: Activity },
      { title: 'Monitoreo', href: '/admin/system/monitoring', icon: Eye },
      { title: 'Respaldos', href: '/admin/system/backups', icon: Database },
    ],
  },
  {
    title: 'Soporte',
    href: '/admin/support',
    icon: HelpCircle,
    description: 'Tickets y atención al cliente',
    children: [
      { title: 'Tickets', href: '/admin/support/tickets', icon: HelpCircle },
      { title: 'FAQ', href: '/admin/support/faq', icon: FileText },
      { title: 'Notificaciones', href: '/admin/support/notifications', icon: Bell },
    ],
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isExpanded = (href: string) => expandedItems.includes(href)

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const active = isActive(item.href)
    const expanded = isExpanded(item.href)

    return (
      <div key={item.href}>
        <div
          className={cn(
            'group relative',
            level > 0 && 'ml-4'
          )}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-left font-normal',
                active && 'bg-accent text-accent-foreground',
                collapsed && 'px-2'
              )}
              onClick={() => toggleExpanded(item.href)}
            >
              <item.icon className={cn('h-4 w-4', collapsed ? 'mr-0' : 'mr-3')} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                  {expanded ? (
                    <ChevronLeft className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-2" />
                  )}
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-left font-normal',
                active && 'bg-accent text-accent-foreground',
                collapsed && 'px-2'
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className={cn('h-4 w-4', collapsed ? 'mr-0' : 'mr-3')} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            </Button>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              {item.title}
              {item.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submenu */}
        {hasChildren && expanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300',
        collapsed ? 'w-16' : 'w-72',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">AIClases Admin</h2>
              <p className="text-xs text-muted-foreground">Panel de Control</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        <Separator className="mb-3" />
        
        {!collapsed && (
          <div className="mb-3 p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Sistema</span>
            </div>
            <div className="text-xs text-green-600 font-medium">
              Operativo ✓
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
            collapsed && 'px-2'
          )}
        >
          <LogOut className={cn('h-4 w-4', collapsed ? 'mr-0' : 'mr-3')} />
          {!collapsed && 'Cerrar Sesión'}
        </Button>
      </div>
    </div>
  )
}