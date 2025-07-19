import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Brain,
  Target,
  Calendar,
  ChevronRight,
  Play,
  CheckCircle
} from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Progress } from '@ui/components/progress'

const enrolledCourses = [
  {
    id: '1',
    title: 'Fundamentos de Inteligencia Artificial',
    slug: 'fundamentos-ia',
    progress: 75,
    completedLessons: 9,
    totalLessons: 12,
    nextLesson: 'Ética en la Inteligencia Artificial',
    lastAccessed: '2024-01-15',
    timeSpent: 6.2,
    category: 'Fundamentos IA'
  },
  {
    id: '2',
    title: 'Machine Learning Práctico',
    slug: 'machine-learning-practico',
    progress: 30,
    completedLessons: 5,
    totalLessons: 18,
    nextLesson: 'Algoritmos de Clasificación',
    lastAccessed: '2024-01-14',
    timeSpent: 3.8,
    category: 'Machine Learning'
  },
  {
    id: '3',
    title: 'Productividad con IA',
    slug: 'productividad-ia',
    progress: 100,
    completedLessons: 10,
    totalLessons: 10,
    nextLesson: null,
    lastAccessed: '2024-01-10',
    timeSpent: 6.0,
    category: 'Productividad',
    completed: true
  }
]

const achievements = [
  {
    id: '1',
    title: 'Primer Curso Completado',
    description: 'Completaste tu primer curso de IA',
    icon: Trophy,
    color: 'text-yellow-500',
    earned: true
  },
  {
    id: '2',
    title: 'Estudiante Dedicado',
    description: 'Estudiaste 7 días consecutivos',
    icon: Calendar,
    color: 'text-blue-500',
    earned: true
  },
  {
    id: '3',
    title: 'Explorador de IA',
    description: 'Inscríbete en 3 categorías diferentes',
    icon: Brain,
    color: 'text-purple-500',
    earned: false
  },
  {
    id: '4',
    title: 'Maratonista',
    description: 'Estudia 10 horas en una semana',
    icon: Target,
    color: 'text-green-500',
    earned: false
  }
]

const recentActivity = [
  {
    type: 'lesson_completed',
    title: 'Completaste "Tipos de Aprendizaje Automático"',
    course: 'Fundamentos de IA',
    time: '2 horas',
    icon: CheckCircle,
    color: 'text-green-500'
  },
  {
    type: 'course_started',
    title: 'Comenzaste "Machine Learning Práctico"',
    course: 'Machine Learning Práctico',
    time: '1 día',
    icon: Play,
    color: 'text-blue-500'
  },
  {
    type: 'achievement',
    title: 'Desbloqueaste "Estudiante Dedicado"',
    course: null,
    time: '2 días',
    icon: Trophy,
    color: 'text-yellow-500'
  },
  {
    type: 'course_completed',
    title: 'Completaste "Productividad con IA"',
    course: 'Productividad con IA',
    time: '5 días',
    icon: Trophy,
    color: 'text-purple-500'
  }
]

const stats = {
  totalCourses: 3,
  completedCourses: 1,
  totalHours: 16.0,
  weekStreak: 7,
  creditsEarned: 150,
  creditsSpent: 2050
}

function CourseCard({ course }: { course: typeof enrolledCourses[0] }) {
  return (
    <Card className="p-6 glass-morphism border-0 hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Badge variant="outline" className="mb-2">
            {course.category}
          </Badge>
          <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
          {course.completed ? (
            <Badge className="bg-green-500 text-white">
              ✅ Completado
            </Badge>
          ) : (
            <div className="text-sm text-muted-foreground">
              Siguiente: {course.nextLesson}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso</span>
            <span>{course.completedLessons}/{course.totalLessons} lecciones</span>
          </div>
          <Progress value={course.progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {course.progress}% completado
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.timeSpent}h estudiadas
          </div>
          <div>
            Último acceso: {new Date(course.lastAccessed).toLocaleDateString()}
          </div>
        </div>

        <Button 
          className="w-full glass-morphism" 
          variant={course.completed ? "outline" : "default"}
          asChild
        >
          <Link href={`/learn/${course.slug}`}>
            {course.completed ? 'Revisar Curso' : 'Continuar Aprendiendo'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
        <activity.icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{activity.title}</p>
        {activity.course && (
          <p className="text-sm text-muted-foreground">{activity.course}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        hace {activity.time}
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: typeof achievements[0] }) {
  return (
    <Card className={`p-4 border-0 ${achievement.earned ? 'glass-morphism' : 'bg-muted/50'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${achievement.earned ? achievement.color : 'text-muted-foreground'}`}>
          <achievement.icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${!achievement.earned && 'text-muted-foreground'}`}>
            {achievement.title}
          </h4>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>
        </div>
        {achievement.earned && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          ¡Bienvenido de vuelta! 👋
        </h1>
        <p className="text-muted-foreground">
          Continúa tu viaje de aprendizaje en Inteligencia Artificial
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {stats.totalCourses}
          </div>
          <div className="text-xs text-muted-foreground">
            Cursos Inscritos
          </div>
        </Card>
        
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-green-500 mb-1">
            {stats.completedCourses}
          </div>
          <div className="text-xs text-muted-foreground">
            Completados
          </div>
        </Card>
        
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-blue-500 mb-1">
            {stats.totalHours}h
          </div>
          <div className="text-xs text-muted-foreground">
            Tiempo Total
          </div>
        </Card>
        
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-orange-500 mb-1">
            {stats.weekStreak}
          </div>
          <div className="text-xs text-muted-foreground">
            Días Seguidos
          </div>
        </Card>
        
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-purple-500 mb-1">
            {stats.creditsEarned}
          </div>
          <div className="text-xs text-muted-foreground">
            Créditos Ganados
          </div>
        </Card>
        
        <Card className="p-4 glass-morphism border-0 text-center">
          <div className="text-2xl font-bold text-red-500 mb-1">
            {stats.creditsSpent}
          </div>
          <div className="text-xs text-muted-foreground">
            Créditos Gastados
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* My Courses */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Mis Cursos
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/courses">
                  Explorar Más
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Actividad Reciente
            </h2>
            
            <Card className="p-6 glass-morphism border-0">
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Button className="w-full justify-start glass-morphism" asChild>
                <Link href="/mentor">
                  <Brain className="mr-2 h-4 w-4" />
                  Chatear con Mentor AI
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start glass-morphism" asChild>
                <Link href="/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explorar Cursos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start glass-morphism" asChild>
                <Link href="/community">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Logros
                </Link>
              </Button>
            </div>
          </section>

          {/* Achievements */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Logros
            </h2>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>

          {/* Study Streak */}
          <Card className="p-6 glass-morphism border-0">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Racha de Estudio
            </h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {stats.weekStreak} días
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                ¡Increíble! Sigue así
              </p>
              <div className="flex justify-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-6 h-6 rounded-full ${
                      i < stats.weekStreak 
                        ? 'bg-orange-500' 
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}