'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@ui/components/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@ui/components/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/avatar'
import { Badge } from '@ui/components/badge'
import { Input } from '@ui/components/input'
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Activity,
  Eye,
  AlertTriangle,
  CheckCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

interface AdminHeaderProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  timestamp: string
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')

  // Load notifications and system status
  useEffect(() => {
    loadNotifications()
    checkSystemStatus()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      checkSystemStatus()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      // Mock notifications - replace with real API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Nuevo usuario registrado',
          message: '5 nuevos usuarios se registraron en la última hora',
          type: 'info',
          read: false,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Pago completado',
          message: 'Pago de $59 USD procesado exitosamente',
          type: 'success',
          read: false,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          title: 'Error en servidor',
          message: 'Error temporal en el servidor de MentorAI',
          type: 'warning',
          read: true,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ]
      
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const checkSystemStatus = async () => {
    try {
      // Mock system status check - replace with real health check
      const healthCheck = await fetch('/api/admin/health', {
        method: 'GET',
        cache: 'no-store',
      })
      
      if (healthCheck.ok) {
        const data = await healthCheck.json()
        setSystemStatus(data.status || 'healthy')
      } else {
        setSystemStatus('warning')
      }
    } catch (error) {
      setSystemStatus('error')
    }
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getSystemStatusBadge = () => {
    switch (systemStatus) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Operativo</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Alerta</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios, cursos, transacciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </form>

        <div className="flex items-center gap-4 ml-6">
          {/* System Status */}
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${
              systemStatus === 'healthy' ? 'text-green-500' : 
              systemStatus === 'warning' ? 'text-yellow-500' : 'text-red-500'
            }`} />
            {getSystemStatusBadge()}
          </div>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" />
                Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" />
                Oscuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="h-4 w-4 mr-2" />
                Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center"
                    onClick={() => router.push('/admin/notifications')}
                  >
                    Ver todas las notificaciones
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || 'Administrador'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="text-xs w-fit mt-1">
                    Administrador
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/system/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Vista de Usuario</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}