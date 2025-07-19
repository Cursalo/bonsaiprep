import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock API handlers
const handlers = [
  // Auth endpoints
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    )
  }),

  rest.post('/api/auth/signout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ ok: true }))
  }),

  rest.get('/api/auth/session', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    )
  }),

  // Courses endpoints
  rest.get('/api/courses', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'course-1',
          title: 'Test Course 1',
          description: 'A test course',
          price: 99.99,
          lessons: [],
        },
        {
          id: 'course-2',
          title: 'Test Course 2',
          description: 'Another test course',
          price: 149.99,
          lessons: [],
        },
      ])
    )
  }),

  rest.get('/api/courses/:id', (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        id,
        title: `Test Course ${id}`,
        description: 'A detailed test course',
        price: 99.99,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Introduction',
            content: 'Test lesson content',
            duration: 300,
          },
        ],
      })
    )
  }),

  // User endpoints
  rest.get('/api/user/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
        enrolledCourses: [],
      })
    )
  }),

  rest.put('/api/user/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated Test User',
        credits: 100,
        enrolledCourses: [],
      })
    )
  }),

  // Payment endpoints
  rest.post('/api/payment/create-intent', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        clientSecret: 'pi_test_client_secret',
        publishableKey: 'pk_test_publishable_key',
      })
    )
  }),

  rest.post('/api/payment/confirm', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        paymentIntent: {
          id: 'pi_test_payment_intent',
          status: 'succeeded',
        },
      })
    )
  }),

  // Mentor AI endpoints
  rest.post('/api/mentor-ai/chat', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        response: 'Test AI response',
        creditsUsed: 1,
        remainingCredits: 99,
      })
    )
  }),

  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      })
    )
  }),

  // Error endpoints for testing error handling
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'Internal Server Error',
        message: 'Test server error',
      })
    )
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        error: 'Not Found',
        message: 'Resource not found',
      })
    )
  }),
]

// Create server
export const server = setupServer(...handlers)

// Export handlers for test customization
export { handlers, rest }