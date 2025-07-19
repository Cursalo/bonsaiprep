// Test data factories for consistent test data generation

export interface TestUser {
  id: string
  email: string
  name: string
  credits: number
  enrolledCourses: string[]
  completedLessons: string[]
  createdAt: string
  role: 'user' | 'admin' | 'instructor'
}

export interface TestCourse {
  id: string
  title: string
  description: string
  price: number
  duration: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  instructor: string
  lessons: TestLesson[]
  enrolled: boolean
  completionRate?: number
  rating?: number
  thumbnail?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TestLesson {
  id: string
  courseId: string
  title: string
  content: string
  duration: number
  order: number
  completed: boolean
  videoUrl?: string
  resources: TestResource[]
  quiz?: TestQuiz
  createdAt: string
}

export interface TestResource {
  id: string
  title: string
  type: 'pdf' | 'video' | 'link' | 'code'
  url: string
  description?: string
}

export interface TestQuiz {
  id: string
  title: string
  questions: TestQuestion[]
  passingScore: number
  attempts: number
  timeLimit?: number
}

export interface TestQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'text'
  options?: string[]
  correctAnswer: string | number
  explanation?: string
}

export interface TestPayment {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'mercadopago'
  packageType: 'credits' | 'course' | 'subscription'
  metadata: Record<string, any>
  createdAt: string
}

// Factory functions
let userCounter = 1
let courseCounter = 1
let lessonCounter = 1
let paymentCounter = 1

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => {
  const id = `user-${userCounter++}`
  return {
    id,
    email: `user${userCounter}@test.com`,
    name: `Test User ${userCounter}`,
    credits: 100,
    enrolledCourses: [],
    completedLessons: [],
    createdAt: new Date().toISOString(),
    role: 'user',
    ...overrides,
  }
}

export const createTestCourse = (overrides: Partial<TestCourse> = {}): TestCourse => {
  const id = `course-${courseCounter++}`
  return {
    id,
    title: `Test Course ${courseCounter}`,
    description: `Description for test course ${courseCounter}`,
    price: 99.99,
    duration: 3600,
    level: 'beginner',
    category: 'programming',
    instructor: 'Test Instructor',
    lessons: [],
    enrolled: false,
    rating: 4.5,
    tags: ['test', 'programming'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export const createTestLesson = (overrides: Partial<TestLesson> = {}): TestLesson => {
  const id = `lesson-${lessonCounter++}`
  return {
    id,
    courseId: `course-${courseCounter}`,
    title: `Test Lesson ${lessonCounter}`,
    content: `Content for test lesson ${lessonCounter}`,
    duration: 300,
    order: lessonCounter,
    completed: false,
    resources: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export const createTestPayment = (overrides: Partial<TestPayment> = {}): TestPayment => {
  const id = `payment-${paymentCounter++}`
  return {
    id,
    userId: `user-${userCounter}`,
    amount: 99.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'stripe',
    packageType: 'credits',
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export const createTestResource = (overrides: Partial<TestResource> = {}): TestResource => {
  return {
    id: `resource-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Resource',
    type: 'pdf',
    url: 'https://example.com/resource.pdf',
    description: 'A test resource',
    ...overrides,
  }
}

export const createTestQuiz = (overrides: Partial<TestQuiz> = {}): TestQuiz => {
  return {
    id: `quiz-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Quiz',
    questions: [createTestQuestion()],
    passingScore: 70,
    attempts: 3,
    timeLimit: 600,
    ...overrides,
  }
}

export const createTestQuestion = (overrides: Partial<TestQuestion> = {}): TestQuestion => {
  return {
    id: `question-${Math.random().toString(36).substr(2, 9)}`,
    question: 'What is the correct answer?',
    type: 'multiple-choice',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Option A is correct because...',
    ...overrides,
  }
}

// Batch creation utilities
export const createTestUsers = (count: number, overrides: Partial<TestUser> = []): TestUser[] => {
  return Array.from({ length: count }, (_, index) => 
    createTestUser(Array.isArray(overrides) ? overrides[index] : overrides)
  )
}

export const createTestCourses = (count: number, overrides: Partial<TestCourse> = []): TestCourse[] => {
  return Array.from({ length: count }, (_, index) => 
    createTestCourse(Array.isArray(overrides) ? overrides[index] : overrides)
  )
}

export const createTestLessons = (count: number, courseId: string, overrides: Partial<TestLesson> = []): TestLesson[] => {
  return Array.from({ length: count }, (_, index) => 
    createTestLesson({
      courseId,
      order: index + 1,
      ...(Array.isArray(overrides) ? overrides[index] : overrides)
    })
  )
}

// Course with lessons factory
export const createCourseWithLessons = (
  lessonCount: number = 3,
  courseOverrides: Partial<TestCourse> = {},
  lessonOverrides: Partial<TestLesson> = {}
): TestCourse => {
  const course = createTestCourse(courseOverrides)
  const lessons = createTestLessons(lessonCount, course.id, lessonOverrides)
  
  return {
    ...course,
    lessons,
    duration: lessons.reduce((total, lesson) => total + lesson.duration, 0),
  }
}

// Enrolled user factory
export const createEnrolledUser = (courses: TestCourse[]): TestUser => {
  return createTestUser({
    enrolledCourses: courses.map(course => course.id),
  })
}

// Progress tracking utilities
export const createUserProgress = (
  user: TestUser,
  course: TestCourse,
  completionRate: number = 0.5
): TestUser => {
  const lessonsToComplete = Math.floor(course.lessons.length * completionRate)
  const completedLessons = course.lessons
    .slice(0, lessonsToComplete)
    .map(lesson => lesson.id)
  
  return {
    ...user,
    completedLessons: [...user.completedLessons, ...completedLessons],
  }
}

// API response factories
export const createApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  message: success ? 'Operation successful' : 'Operation failed',
  timestamp: new Date().toISOString(),
})

export const createApiError = (message: string, code: number = 500) => ({
  success: false,
  error: {
    message,
    code,
    timestamp: new Date().toISOString(),
  },
})

// Session factory
export const createTestSession = (user: TestUser) => ({
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

// Reset counters for predictable tests
export const resetCounters = () => {
  userCounter = 1
  courseCounter = 1
  lessonCounter = 1
  paymentCounter = 1
}