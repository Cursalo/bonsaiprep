import { test as base, expect, Page, BrowserContext } from '@playwright/test'
import { LoginPage } from '../pages/login-page'
import { DashboardPage } from '../pages/dashboard-page'
import { CoursePage } from '../pages/course-page'
import { CheckoutPage } from '../pages/checkout-page'
import { AdminPage } from '../pages/admin-page'
import { MentorChatPage } from '../pages/mentor-chat-page'

type TestFixtures = {
  loginPage: LoginPage
  dashboardPage: DashboardPage
  coursePage: CoursePage
  checkoutPage: CheckoutPage
  adminPage: AdminPage
  mentorChatPage: MentorChatPage
  authenticatedPage: Page
  adminPage_auth: Page
  studentPage: Page
}

type WorkerFixtures = {
  authenticatedContext: BrowserContext
  adminContext: BrowserContext
  studentContext: BrowserContext
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixtures (shared across tests in the same worker)
  authenticatedContext: [async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/student.json'
    })
    await use(context)
    await context.close()
  }, { scope: 'worker' }],

  adminContext: [async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json'
    })
    await use(context)
    await context.close()
  }, { scope: 'worker' }],

  studentContext: [async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/student.json'
    })
    await use(context)
    await context.close()
  }, { scope: 'worker' }],

  // Test-scoped fixtures
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage()
    await use(page)
    await page.close()
  },

  adminPage_auth: async ({ adminContext }, use) => {
    const page = await adminContext.newPage()
    await use(page)
    await page.close()
  },

  studentPage: async ({ studentContext }, use) => {
    const page = await studentContext.newPage()
    await use(page)
    await page.close()
  },

  // Page Object Model fixtures
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    await use(dashboardPage)
  },

  coursePage: async ({ page }, use) => {
    const coursePage = new CoursePage(page)
    await use(coursePage)
  },

  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page)
    await use(checkoutPage)
  },

  adminPage: async ({ page }, use) => {
    const adminPage = new AdminPage(page)
    await use(adminPage)
  },

  mentorChatPage: async ({ page }, use) => {
    const mentorChatPage = new MentorChatPage(page)
    await use(mentorChatPage)
  },
})

// Custom expect matchers for AIClases-specific assertions
expect.extend({
  // Custom matcher for checking if a user has a specific credit balance
  async toHaveCredits(page: Page, expectedCredits: number) {
    const creditsElement = page.locator('[data-testid="credits-balance"]')
    await expect(creditsElement).toBeVisible()
    
    const creditsText = await creditsElement.textContent()
    const actualCredits = parseInt(creditsText?.replace(/\D/g, '') || '0')
    
    const pass = actualCredits === expectedCredits
    
    return {
      message: () => pass 
        ? `Expected credits NOT to be ${expectedCredits}, but was ${actualCredits}`
        : `Expected credits to be ${expectedCredits}, but was ${actualCredits}`,
      pass,
    }
  },

  // Custom matcher for checking enrollment status
  async toBeEnrolledInCourse(page: Page, courseName: string) {
    const enrollmentBadge = page.locator(`[data-testid="enrollment-badge-${courseName}"]`)
    const isVisible = await enrollmentBadge.isVisible()
    
    return {
      message: () => isVisible
        ? `Expected user NOT to be enrolled in ${courseName}`
        : `Expected user to be enrolled in ${courseName}`,
      pass: isVisible,
    }
  },

  // Custom matcher for checking course progress
  async toHaveProgressPercentage(page: Page, expectedPercentage: number) {
    const progressElement = page.locator('[data-testid="course-progress"]')
    await expect(progressElement).toBeVisible()
    
    const progressValue = await progressElement.getAttribute('aria-valuenow')
    const actualPercentage = parseInt(progressValue || '0')
    
    const pass = actualPercentage === expectedPercentage
    
    return {
      message: () => pass
        ? `Expected progress NOT to be ${expectedPercentage}%, but was ${actualPercentage}%`
        : `Expected progress to be ${expectedPercentage}%, but was ${actualPercentage}%`,
      pass,
    }
  },

  // Custom matcher for checking notification presence
  async toHaveNotification(page: Page, notificationText: string) {
    const notification = page.locator('[data-testid="toast-notification"]', { hasText: notificationText })
    const isVisible = await notification.isVisible()
    
    return {
      message: () => isVisible
        ? `Expected notification "${notificationText}" NOT to be visible`
        : `Expected notification "${notificationText}" to be visible`,
      pass: isVisible,
    }
  },
})

// Declare custom matchers for TypeScript
declare module '@playwright/test' {
  interface PageAssertions {
    toHaveCredits(expectedCredits: number): Promise<void>
    toBeEnrolledInCourse(courseName: string): Promise<void>
    toHaveProgressPercentage(expectedPercentage: number): Promise<void>
    toHaveNotification(notificationText: string): Promise<void>
  }
}

export { expect }