'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { Progress } from '@ui/components/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/tabs'
import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  UserPlus,
  GraduationCap,
  Eye,
  Star,
  Download,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface AdminDashboardProps {
  userId: string
}

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  activeUsers: number
  newUsersToday: number
  completionRate: number
  avgSessionTime: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'course_enrollment' | 'payment' | 'course_completion'
  user: string
  description: string
  timestamp: string
  amount?: number
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    activeUsers: 0,
    newUsersToday: 0,
    completionRate: 0,
    avgSessionTime: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Chart data
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [courseEngagementData, setCourseEngagementData] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [userId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadSystemAlerts(),
        loadChartData(),
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Mock data for development
      setStats({
        totalUsers: 2847,
        totalCourses: 45,
        totalEnrollments: 8924,
        totalRevenue: 47250,
        activeUsers: 1234,
        newUsersToday: 23,
        completionRate: 78.5,
        avgSessionTime: 42,
      })
    }
  }

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity')
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data)
      }
    } catch (error) {
      console.error('Error loading recent activity:', error)
      // Mock data
      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          user: 'María González',
          description: 'Se registró un nuevo usuario',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'payment',
          user: 'Carlos Ruiz',
          description: 'Compró 1200 créditos',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          amount: 59,
        },
        {
          id: '3',
          type: 'course_completion',
          user: 'Ana López',
          description: 'Completó "Fundamentos de Machine Learning"',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'course_enrollment',
          user: 'Diego Martín',
          description: 'Se inscribió en "Deep Learning Avanzado"',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
      ])
    }
  }

  const loadSystemAlerts = async () => {
    try {
      const response = await fetch('/api/admin/alerts')
      if (response.ok) {
        const data = await response.json()
        setSystemAlerts(data)
      }
    } catch (error) {
      console.error('Error loading system alerts:', error)
      // Mock data
      setSystemAlerts([
        {
          id: '1',
          type: 'warning',
          title: 'Alto uso de memoria',
          description: 'El servidor está usando 85% de memoria RAM',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false,
        },
        {
          id: '2',
          type: 'info',
          title: 'Actualización programada',
          description: 'Mantenimiento programado para mañana a las 2:00 AM',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false,
        },
      ])
    }
  }

  const loadChartData = async () => {
    // Mock chart data
    const userGrowth = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: Math.floor(Math.random() * 50) + 20,
      enrollments: Math.floor(Math.random() * 100) + 30,
    }))

    const revenue = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('es', { month: 'short' }),
      revenue: Math.floor(Math.random() * 5000) + 2000,
      transactions: Math.floor(Math.random() * 200) + 50,
    }))

    const courseEngagement = [
      { name: 'Fundamentos de IA', students: 1200, completion: 85 },
      { name: 'Machine Learning', students: 980, completion: 78 },
      { name: 'Deep Learning', students: 750, completion: 72 },
      { name: 'NLP Básico', students: 650, completion: 89 },
      { name: 'Computer Vision', students: 580, completion: 76 },
    ]

    setUserGrowthData(userGrowth)
    setRevenueData(revenue)
    setCourseEngagementData(courseEngagement)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'course_enrollment':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'payment':
        return <CreditCard className="h-4 w-4 text-purple-500" />
      case 'course_completion':
        return <GraduationCap className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Vista general del sistema AIClases 4.0
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsersToday} nuevos hoy
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Alertas del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <Badge variant="outline" className="text-orange-600">
                      Pendiente
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Crecimiento de Usuarios</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Últimas actividades del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.user}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {activity.amount && (
                        <div className="text-sm font-medium text-green-600">
                          +{formatCurrency(activity.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Usuarios</CardTitle>
              <CardDescription>
                Métricas detalladas de usuarios registrados y activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                  <Line type="monotone" dataKey="enrollments" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ingresos</CardTitle>
              <CardDescription>
                Ingresos mensuales y transacciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement de Cursos</CardTitle>
              <CardDescription>
                Participación y finalización por curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseEngagementData.map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">{course.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {course.students} estudiantes inscritos
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {course.completion}%
                      </div>
                    </div>
                    <Progress value={course.completion} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}