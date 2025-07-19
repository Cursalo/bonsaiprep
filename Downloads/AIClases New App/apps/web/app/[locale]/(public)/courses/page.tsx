'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Clock, Star, Users, BookOpen, Filter, Search } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Input } from '@ui/components/input'
import { LoadingSpinner } from '@ui/components/loading-spinner'
import { ErrorBoundary } from '@/components/error-boundary/error-boundary'
import { CourseGridSkeleton } from '@/components/loading/skeleton'
import { useDataFetch } from '@/hooks/use-loading'
import { useToast } from '@/components/toast/toast-provider'


interface Course {
  id: string
  title: string
  description: string
  slug: string
  category: string
  level: string
  duration: number
  price: number
  rating: number
  students: number
  lessons: number
  published: boolean
  instructor: string
  thumbnail: string
}

function CourseCard({ course }: { course: Course }) {
  const t = useTranslations('courseCard')
  const tCourses = useTranslations('courses')
  
  const getLevelName = (levelId: string) => {
    return t(`level.${levelId}`)
  }
  
  const getCategoryName = (categoryId: string) => {
    return t(`categories.${categoryId}`)
  }
  
  const getLevelColor = (levelId: string) => {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500', 
      advanced: 'bg-red-500'
    }
    return colors[levelId as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <Card className="group overflow-hidden glass-morphism border-0 hover:scale-105 transition-all duration-300">
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-primary/50" />
        </div>
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className={`${getLevelColor(course.level)} text-white`}>
            {getLevelName(course.level)}
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {course.price} {tCourses('credits')}
          </Badge>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {getCategoryName(course.category)}
          </Badge>
        </div>
        
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="text-xs text-muted-foreground mb-4">
          {tCourses('instructor')} {course.instructor}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration}{tCourses('hours').slice(0,1)}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessons} {tCourses('lessons')}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.students.toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{course.rating}</span>
          </div>
          
          <Button size="sm" className="glass-morphism" asChild>
            <Link href={`/courses/${course.slug}`}>
              {tCourses('viewCourse')}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CoursesGrid({ searchQuery = '', selectedCategory = '', selectedLevel = '' }) {
  const { data: courses, isLoading, error, fetch } = useDataFetch([])
  const [filteredCourses, setFilteredCourses] = useState([])

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchQuery, selectedCategory, selectedLevel])

  const loadCourses = async () => {
    // In a real app, this would fetch from an API
    // For now, we'll simulate loading delay and use static data
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Static courses data for demo
    const staticCourses = [
      {
        id: '1',
        title: 'Fundamentos de Inteligencia Artificial',
        description: 'Aprende los conceptos básicos de IA desde cero. Un curso completo para principiantes que cubre desde qué es la IA hasta sus aplicaciones prácticas.',
        slug: 'fundamentos-ia',
        category: 'fundamentos-ia',
        level: 'beginner',
        duration: 8,
        price: 600,
        rating: 4.9,
        students: 2340,
        lessons: 12,
        published: true,
        instructor: 'Dr. María Elena Vázquez',
        thumbnail: '/images/courses/fundamentos-ia.jpg'
      },
      {
        id: '2',
        title: 'Machine Learning Práctico',
        description: 'Domina los algoritmos de aprendizaje automático con ejemplos reales. Incluye Python, scikit-learn y proyectos hands-on.',
        slug: 'machine-learning-practico',
        category: 'machine-learning',
        level: 'intermediate',
        duration: 12,
        price: 900,
        rating: 4.8,
        students: 1890,
        lessons: 18,
        published: true,
        instructor: 'Ing. Carlos Mendoza',
        thumbnail: '/images/courses/ml-practico.jpg'
      },
      {
        id: '3',
        title: 'Productividad con IA',
        description: 'Descubre herramientas de IA para aumentar tu productividad personal y profesional. ChatGPT, Midjourney, Notion AI y más.',
        slug: 'productividad-ia',
        category: 'productividad',
        level: 'beginner',
        duration: 6,
        price: 450,
        rating: 4.7,
        students: 3210,
        lessons: 10,
        published: true,
        instructor: 'Ana López',
        thumbnail: '/images/courses/productividad-ia.jpg'
      },
      {
        id: '4',
        title: 'Deep Learning con TensorFlow',
        description: 'Sumérgete en las redes neuronales profundas. Desde perceptrones hasta redes convolucionales y LSTM.',
        slug: 'deep-learning-tensorflow',
        category: 'deep-learning',
        level: 'advanced',
        duration: 16,
        price: 1200,
        rating: 4.9,
        students: 987,
        lessons: 24,
        published: true,
        instructor: 'PhD. Roberto Fernández',
        thumbnail: '/images/courses/deep-learning.jpg'
      },
      {
        id: '5',
        title: 'Procesamiento de Lenguaje Natural',
        description: 'Aprende a construir sistemas que entienden y generan texto humano. Desde tokenización hasta transformers.',
        slug: 'nlp-avanzado',
        category: 'nlp',
        level: 'intermediate',
        duration: 14,
        price: 1050,
        rating: 4.8,
        students: 1234,
        lessons: 20,
        published: true,
        instructor: 'Dra. Sofía Ramírez',
        thumbnail: '/images/courses/nlp.jpg'
      },
      {
        id: '6',
        title: 'Visión por Computadora',
        description: 'Construye sistemas que ven y entienden imágenes. OpenCV, detección de objetos, reconocimiento facial.',
        slug: 'computer-vision',
        category: 'computer-vision',
        level: 'intermediate',
        duration: 10,
        price: 750,
        rating: 4.6,
        students: 856,
        lessons: 15,
        published: true,
        instructor: 'Ing. Diego Torres',
        thumbnail: '/images/courses/computer-vision.jpg'
      }
    ]
    
    // Simulate potential API error (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Failed to load courses')
    }
    
    return staticCourses
  }

  const filterCourses = () => {
    if (!courses) return

    let filtered = [...courses]

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel)
    }

    setFilteredCourses(filtered)
  }

  if (isLoading) {
    return <CourseGridSkeleton count={6} />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadCourses()} variant="outline">
          Reintentar
        </Button>
      </div>
    )
  }

  if (filteredCourses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No se encontraron cursos</h3>
        <p className="text-muted-foreground">
          Intenta ajustar tus filtros de búsqueda
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}

export default function CoursesPage() {
  const t = useTranslations('courses')
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('search')} 
                  className="pl-10 glass-morphism"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Button */}
            <Button 
              variant="outline" 
              className="glass-morphism lg:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('filters')}
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <ErrorBoundary level="component">
                <Card className="p-6 glass-morphism border-0 sticky top-24">
                  <h3 className="font-semibold mb-4">Categorías</h3>
                  <div className="space-y-2 mb-6">
                    <Button 
                      variant={selectedCategory === '' ? 'default' : 'ghost'}
                      className="justify-start h-auto p-2 text-sm font-normal w-full"
                      onClick={() => setSelectedCategory('')}
                    >
                      Todas las categorías
                    </Button>
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <Button 
                          variant={selectedCategory === category.id ? 'default' : 'ghost'}
                          className="justify-start h-auto p-2 text-sm font-normal flex-1"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          ({category.count})
                        </span>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold mb-4">Nivel</h3>
                  <div className="space-y-2">
                    <Button 
                      variant={selectedLevel === '' ? 'default' : 'ghost'}
                      className="justify-start h-auto p-2 text-sm font-normal w-full"
                      onClick={() => setSelectedLevel('')}
                    >
                      Todos los niveles
                    </Button>
                    {levels.map((level) => (
                      <div key={level.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        <Button 
                          variant={selectedLevel === level.id ? 'default' : 'ghost'}
                          className="justify-start h-auto p-2 text-sm font-normal flex-1"
                          onClick={() => setSelectedLevel(level.id)}
                        >
                          {level.name}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Clear Filters */}
                  {(selectedCategory || selectedLevel || searchQuery) && (
                    <div className="mt-6 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedCategory('')
                          setSelectedLevel('')
                          setSearchQuery('')
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  )}
                </Card>
              </ErrorBoundary>
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  <span id="course-count">Cargando cursos...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ordenar por:</span>
                  <Button variant="ghost" size="sm">
                    Más Popular
                  </Button>
                </div>
              </div>

              <ErrorBoundary level="component">
                <CoursesGrid 
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  selectedLevel={selectedLevel}
                />
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}