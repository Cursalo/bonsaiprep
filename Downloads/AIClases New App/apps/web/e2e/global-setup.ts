import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')

  // Create a browser instance for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for the development server to be ready
    const baseURL = config.webServer?.url || 'http://localhost:3000'
    console.log(`⏳ Waiting for server at ${baseURL}...`)
    
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    console.log('✅ Server is ready')

    // Set up test data if needed
    await setupTestData(page)

    // Create authentication states for different user types
    await createAuthStates(page, baseURL)

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ E2E test setup completed')
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...')
  
  // Create test users, courses, etc. via API calls
  // This would typically involve seeding a test database
  
  try {
    // Example: Create test users via API
    await page.evaluate(async () => {
      // Could make fetch calls to setup endpoints
      // or use direct database connections for test data
    })
    
    console.log('✅ Test data setup completed')
  } catch (error) {
    console.warn('⚠️ Test data setup failed, tests may use existing data:', error)
  }
}

async function createAuthStates(page: any, baseURL: string) {
  console.log('🔐 Creating authentication states...')

  const authStates = [
    {
      name: 'student',
      email: 'student@test.com',
      password: 'testpass123',
      file: 'e2e/.auth/student.json'
    },
    {
      name: 'admin',
      email: 'admin@test.com', 
      password: 'adminpass123',
      file: 'e2e/.auth/admin.json'
    },
    {
      name: 'mentor',
      email: 'mentor@test.com',
      password: 'mentorpass123', 
      file: 'e2e/.auth/mentor.json'
    }
  ]

  for (const auth of authStates) {
    try {
      console.log(`🔑 Creating auth state for ${auth.name}...`)
      
      // Navigate to login page
      await page.goto(`${baseURL}/login`)
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', auth.email)
      await page.fill('[data-testid="password-input"]', auth.password)
      await page.click('[data-testid="login-button"]')
      
      // Wait for login to complete
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      
      // Save the authentication state
      await page.context().storageState({ path: auth.file })
      
      console.log(`✅ Auth state saved for ${auth.name}`)
      
      // Logout for next user
      await page.goto(`${baseURL}/api/auth/signout`)
      await page.click('[data-testid="signout-button"]')
      
    } catch (error) {
      console.warn(`⚠️ Failed to create auth state for ${auth.name}:`, error)
      // Continue with other auth states
    }
  }
}

export default globalSetup