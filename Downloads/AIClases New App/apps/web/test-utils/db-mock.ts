// Database mocking utilities for testing

interface MockDatabase {
  users: Map<string, any>
  courses: Map<string, any>
  lessons: Map<string, any>
  enrollments: Map<string, any>
  payments: Map<string, any>
  progress: Map<string, any>
}

class MockDatabaseManager {
  private db: MockDatabase = {
    users: new Map(),
    courses: new Map(),
    lessons: new Map(),
    enrollments: new Map(),
    payments: new Map(),
    progress: new Map(),
  }

  // User operations
  createUser(user: any) {
    this.db.users.set(user.id, { ...user, createdAt: new Date().toISOString() })
    return user
  }

  getUser(id: string) {
    return this.db.users.get(id)
  }

  getUserByEmail(email: string) {
    for (const [, user] of this.db.users) {
      if (user.email === email) return user
    }
    return null
  }

  updateUser(id: string, updates: any) {
    const user = this.db.users.get(id)
    if (!user) throw new Error('User not found')
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }
    this.db.users.set(id, updatedUser)
    return updatedUser
  }

  deleteUser(id: string) {
    return this.db.users.delete(id)
  }

  // Course operations
  createCourse(course: any) {
    this.db.courses.set(course.id, { ...course, createdAt: new Date().toISOString() })
    return course
  }

  getCourse(id: string) {
    return this.db.courses.get(id)
  }

  getAllCourses() {
    return Array.from(this.db.courses.values())
  }

  updateCourse(id: string, updates: any) {
    const course = this.db.courses.get(id)
    if (!course) throw new Error('Course not found')
    
    const updatedCourse = { ...course, ...updates, updatedAt: new Date().toISOString() }
    this.db.courses.set(id, updatedCourse)
    return updatedCourse
  }

  deleteCourse(id: string) {
    return this.db.courses.delete(id)
  }

  // Lesson operations
  createLesson(lesson: any) {
    this.db.lessons.set(lesson.id, { ...lesson, createdAt: new Date().toISOString() })
    return lesson
  }

  getLesson(id: string) {
    return this.db.lessons.get(id)
  }

  getLessonsByCourse(courseId: string) {
    return Array.from(this.db.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order)
  }

  updateLesson(id: string, updates: any) {
    const lesson = this.db.lessons.get(id)
    if (!lesson) throw new Error('Lesson not found')
    
    const updatedLesson = { ...lesson, ...updates, updatedAt: new Date().toISOString() }
    this.db.lessons.set(id, updatedLesson)
    return updatedLesson
  }

  deleteLesson(id: string) {
    return this.db.lessons.delete(id)
  }

  // Enrollment operations
  enrollUser(userId: string, courseId: string) {
    const enrollmentId = `${userId}-${courseId}`
    const enrollment = {
      id: enrollmentId,
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: 'active',
    }
    this.db.enrollments.set(enrollmentId, enrollment)
    return enrollment
  }

  getEnrollment(userId: string, courseId: string) {
    const enrollmentId = `${userId}-${courseId}`
    return this.db.enrollments.get(enrollmentId)
  }

  getUserEnrollments(userId: string) {
    return Array.from(this.db.enrollments.values())
      .filter(enrollment => enrollment.userId === userId)
  }

  unenrollUser(userId: string, courseId: string) {
    const enrollmentId = `${userId}-${courseId}`
    return this.db.enrollments.delete(enrollmentId)
  }

  // Payment operations
  createPayment(payment: any) {
    this.db.payments.set(payment.id, { ...payment, createdAt: new Date().toISOString() })
    return payment
  }

  getPayment(id: string) {
    return this.db.payments.get(id)
  }

  getUserPayments(userId: string) {
    return Array.from(this.db.payments.values())
      .filter(payment => payment.userId === userId)
  }

  updatePayment(id: string, updates: any) {
    const payment = this.db.payments.get(id)
    if (!payment) throw new Error('Payment not found')
    
    const updatedPayment = { ...payment, ...updates, updatedAt: new Date().toISOString() }
    this.db.payments.set(id, updatedPayment)
    return updatedPayment
  }

  // Progress operations
  updateProgress(userId: string, lessonId: string, progress: any) {
    const progressId = `${userId}-${lessonId}`
    const existingProgress = this.db.progress.get(progressId) || {}
    
    const updatedProgress = {
      ...existingProgress,
      userId,
      lessonId,
      ...progress,
      updatedAt: new Date().toISOString(),
    }
    
    this.db.progress.set(progressId, updatedProgress)
    return updatedProgress
  }

  getProgress(userId: string, lessonId: string) {
    const progressId = `${userId}-${lessonId}`
    return this.db.progress.get(progressId)
  }

  getUserProgress(userId: string) {
    return Array.from(this.db.progress.values())
      .filter(progress => progress.userId === userId)
  }

  getCourseProgress(userId: string, courseId: string) {
    const lessons = this.getLessonsByCourse(courseId)
    const userProgress = this.getUserProgress(userId)
    
    return lessons.map(lesson => {
      const progress = userProgress.find(p => p.lessonId === lesson.id)
      return {
        lesson,
        progress: progress || { completed: false, watchTime: 0 },
      }
    })
  }

  // Utility operations
  clear() {
    this.db.users.clear()
    this.db.courses.clear()
    this.db.lessons.clear()
    this.db.enrollments.clear()
    this.db.payments.clear()
    this.db.progress.clear()
  }

  seed(data: Partial<MockDatabase> = {}) {
    if (data.users) {
      data.users.forEach((user, id) => this.db.users.set(id, user))
    }
    if (data.courses) {
      data.courses.forEach((course, id) => this.db.courses.set(id, course))
    }
    if (data.lessons) {
      data.lessons.forEach((lesson, id) => this.db.lessons.set(id, lesson))
    }
    if (data.enrollments) {
      data.enrollments.forEach((enrollment, id) => this.db.enrollments.set(id, enrollment))
    }
    if (data.payments) {
      data.payments.forEach((payment, id) => this.db.payments.set(id, payment))
    }
    if (data.progress) {
      data.progress.forEach((progress, id) => this.db.progress.set(id, progress))
    }
  }

  getStats() {
    return {
      users: this.db.users.size,
      courses: this.db.courses.size,
      lessons: this.db.lessons.size,
      enrollments: this.db.enrollments.size,
      payments: this.db.payments.size,
      progress: this.db.progress.size,
    }
  }

  // Query helpers
  searchCourses(query: string) {
    return Array.from(this.db.courses.values())
      .filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase()) ||
        course.category.toLowerCase().includes(query.toLowerCase())
      )
  }

  getCoursesByCategory(category: string) {
    return Array.from(this.db.courses.values())
      .filter(course => course.category === category)
  }

  getCoursesByInstructor(instructor: string) {
    return Array.from(this.db.courses.values())
      .filter(course => course.instructor === instructor)
  }

  getPopularCourses(limit: number = 10) {
    return Array.from(this.db.courses.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
  }

  getRecentCourses(limit: number = 10) {
    return Array.from(this.db.courses.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
}

// Global mock database instance
export const mockDb = new MockDatabaseManager()

// Supabase client mock
export const createMockSupabaseClient = () => ({
  from: (table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: null, error: null }),
      download: jest.fn().mockResolvedValue({ data: null, error: null }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
    }),
  },
})

// Database test helpers
export const setupTestDatabase = () => {
  beforeEach(() => {
    mockDb.clear()
  })
}

export const seedTestDatabase = (data: any) => {
  mockDb.seed(data)
}

// Mock Prisma client
export const createMockPrismaClient = () => ({
  user: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  course: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  lesson: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enrollment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
})