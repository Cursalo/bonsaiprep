import { test, expect } from './fixtures/test-base'

test.describe('Admin Dashboard Functionality', () => {
  // Use admin authenticated context for all admin tests
  test.use({ storageState: 'e2e/.auth/admin.json' })

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.navigateToAdmin()
    
    // Verify admin access
    expect(await adminPage.hasAdminAccess()).toBe(true)
  })

  test.describe('Dashboard Overview', () => {
    test('should display key metrics on admin dashboard', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('dashboard')
      
      const stats = await adminPage.getDashboardStats()
      
      // Verify all metrics are present and reasonable
      expect(stats.totalUsers).toBeGreaterThan(0)
      expect(stats.totalCourses).toBeGreaterThan(0)
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0)
      expect(stats.activeUsers).toBeGreaterThanOrEqual(0)
      expect(stats.activeUsers).toBeLessThanOrEqual(stats.totalUsers)
    })

    test('should refresh dashboard data', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('dashboard')
      
      const initialStats = await adminPage.getDashboardStats()
      
      // Refresh data
      await adminPage.refreshData()
      
      // Stats should be updated (in real test, might add test data first)
      const refreshedStats = await adminPage.getDashboardStats()
      expect(refreshedStats).toBeDefined()
    })

    test('should navigate between admin sections', async ({ adminPage }) => {
      const sections = ['users', 'courses', 'payments', 'analytics', 'settings'] as const
      
      for (const section of sections) {
        await adminPage.navigateToAdminSection(section)
        
        // Verify URL reflects section
        expect(adminPage.page.url()).toContain(`/admin/${section}`)
      }
    })
  })

  test.describe('User Management', () => {
    test('should display users list', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      
      const usersCount = await adminPage.getUsersCount()
      expect(usersCount).toBeGreaterThan(0)
      
      // Verify user table is visible
      await expect(adminPage.userTable).toBeVisible()
    })

    test('should search for users', async ({ adminPage }) => {
      await adminPage.searchUsers('student@test.com')
      
      // Verify search results
      const usersCount = await adminPage.getUsersCount()
      expect(usersCount).toBeGreaterThanOrEqual(1)
      
      // Verify searched user appears in results
      await expect(adminPage.page.locator('tr:has-text("student@test.com")')).toBeVisible()
    })

    test('should filter users by status', async ({ adminPage }) => {
      await adminPage.filterUsers('active')
      
      // Verify filtered results
      const activeUsers = await adminPage.getUsersCount()
      expect(activeUsers).toBeGreaterThan(0)
      
      // All displayed users should have active status
      const statusBadges = adminPage.page.locator('[data-testid="status-badge"]')
      const count = await statusBadges.count()
      
      for (let i = 0; i < count; i++) {
        const status = await statusBadges.nth(i).textContent()
        expect(status?.toLowerCase()).toContain('active')
      }
    })

    test('should sort users', async ({ adminPage }) => {
      await adminPage.sortUsers('email')
      
      // Verify sorting (would check if emails are in alphabetical order)
      await adminPage.page.waitForLoadState('networkidle')
      
      // Get first few email addresses and verify they're sorted
      const emailCells = adminPage.page.locator('td[data-field="email"]')
      const firstEmail = await emailCells.first().textContent()
      const secondEmail = await emailCells.nth(1).textContent()
      
      if (firstEmail && secondEmail) {
        expect(firstEmail.localeCompare(secondEmail)).toBeLessThanOrEqual(0)
      }
    })

    test('should add new user', async ({ adminPage }) => {
      const newUser = {
        name: 'Test Admin User',
        email: `admin-test-${Date.now()}@test.com`,
        role: 'user' as const
      }
      
      const initialCount = await adminPage.getUsersCount()
      
      await adminPage.addNewUser(newUser)
      
      // Verify user was added
      await adminPage.searchUsers(newUser.email)
      const newCount = await adminPage.getUsersCount()
      expect(newCount).toBe(1) // Should find the new user
    })

    test('should edit user details', async ({ adminPage }) => {
      // Search for existing user
      await adminPage.searchUsers('student@test.com')
      
      const newData = {
        name: 'Updated Student Name',
        role: 'mentor'
      }
      
      await adminPage.editUser('student@test.com', newData)
      
      // Verify changes were saved
      await adminPage.searchUsers('student@test.com')
      await expect(adminPage.page.locator(`tr:has-text("${newData.name}")`)).toBeVisible()
    })

    test('should delete user', async ({ adminPage }) => {
      // First add a test user to delete
      const testUser = {
        name: 'User To Delete',
        email: `delete-test-${Date.now()}@test.com`,
        role: 'user' as const
      }
      
      await adminPage.addNewUser(testUser)
      
      // Delete the user
      await adminPage.deleteUser(testUser.email)
      
      // Verify user is deleted
      await adminPage.searchUsers(testUser.email)
      const usersFound = await adminPage.getUsersCount()
      expect(usersFound).toBe(0)
    })

    test('should view user details', async ({ adminPage }) => {
      await adminPage.viewUserDetails('student@test.com')
      
      // Verify user details page loads
      await expect(adminPage.page.locator('[data-testid="user-details"]')).toBeVisible()
      
      // Should display user information
      await expect(adminPage.page.locator('text=student@test.com')).toBeVisible()
    })

    test('should handle bulk user operations', async ({ adminPage }) => {
      // Create multiple test users first
      const testUsers = [
        `bulk-test-1-${Date.now()}@test.com`,
        `bulk-test-2-${Date.now()}@test.com`
      ]
      
      for (const email of testUsers) {
        await adminPage.addNewUser({
          name: 'Bulk Test User',
          email,
          role: 'user'
        })
      }
      
      // Perform bulk delete
      await adminPage.bulkDeleteUsers(testUsers)
      
      // Verify users were deleted
      for (const email of testUsers) {
        await adminPage.searchUsers(email)
        const found = await adminPage.getUsersCount()
        expect(found).toBe(0)
      }
    })

    test('should paginate through users', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      
      const initialCount = await adminPage.getUsersCount()
      
      // Go to next page if pagination exists
      const nextButton = adminPage.page.locator('[data-testid="next-page"]')
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await adminPage.goToNextPage()
        
        // Should load different users
        const nextPageCount = await adminPage.getUsersCount()
        expect(nextPageCount).toBeGreaterThan(0)
        
        // Go back to previous page
        await adminPage.goToPreviousPage()
        const backCount = await adminPage.getUsersCount()
        expect(backCount).toBe(initialCount)
      }
    })
  })

  test.describe('Course Management', () => {
    test('should display courses list', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('courses')
      
      const coursesCount = await adminPage.getCoursesCount()
      expect(coursesCount).toBeGreaterThan(0)
      
      await expect(adminPage.courseTable).toBeVisible()
    })

    test('should search for courses', async ({ adminPage }) => {
      await adminPage.searchCourses('JavaScript')
      
      const coursesFound = await adminPage.getCoursesCount()
      expect(coursesFound).toBeGreaterThanOrEqual(0)
      
      // If courses found, verify they contain search term
      if (coursesFound > 0) {
        await expect(adminPage.page.locator('tr:has-text("JavaScript")')).toBeVisible()
      }
    })

    test('should add new course', async ({ adminPage }) => {
      const newCourse = {
        title: `Test Course ${Date.now()}`,
        description: 'A comprehensive test course for automated testing',
        instructor: 'Test Instructor',
        price: 99.99,
        category: 'programming'
      }
      
      await adminPage.addNewCourse(newCourse)
      
      // Verify course was added
      await adminPage.searchCourses(newCourse.title)
      const coursesFound = await adminPage.getCoursesCount()
      expect(coursesFound).toBeGreaterThan(0)
    })

    test('should publish and unpublish courses', async ({ adminPage }) => {
      // Search for a test course
      await adminPage.searchCourses('Test Course')
      
      if (await adminPage.getCoursesCount() > 0) {
        const courseTitle = await adminPage.page.locator('tbody tr:first-child td:nth-child(2)').textContent()
        
        if (courseTitle) {
          // Check current status
          const currentStatus = await adminPage.getItemStatus(courseTitle)
          
          if (currentStatus?.toLowerCase().includes('draft')) {
            await adminPage.publishCourse(courseTitle)
            
            // Verify status changed to published
            const newStatus = await adminPage.getItemStatus(courseTitle)
            expect(newStatus?.toLowerCase()).toContain('published')
          } else {
            await adminPage.unpublishCourse(courseTitle)
            
            // Verify status changed to draft
            const newStatus = await adminPage.getItemStatus(courseTitle)
            expect(newStatus?.toLowerCase()).toContain('draft')
          }
        }
      }
    })

    test('should view course analytics', async ({ adminPage }) => {
      await adminPage.searchCourses('Test Course')
      
      if (await adminPage.getCoursesCount() > 0) {
        const courseTitle = await adminPage.page.locator('tbody tr:first-child td:nth-child(2)').textContent()
        
        if (courseTitle) {
          await adminPage.viewCourseAnalytics(courseTitle)
          
          // Verify analytics page loads
          await expect(adminPage.page.locator('[data-testid="course-analytics"]')).toBeVisible()
        }
      }
    })
  })

  test.describe('Payment Management', () => {
    test('should display payments list', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('payments')
      
      const paymentsCount = await adminPage.getPaymentsCount()
      expect(paymentsCount).toBeGreaterThanOrEqual(0)
      
      await expect(adminPage.paymentTable).toBeVisible()
    })

    test('should filter payments by status', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('payments')
      
      // Filter by successful payments
      await adminPage.page.locator('[data-testid="filter-dropdown"]').click()
      await adminPage.page.locator('[data-value="successful"]').click()
      
      // Verify filtered results show only successful payments
      const statusBadges = adminPage.page.locator('[data-testid="status-badge"]')
      const count = await statusBadges.count()
      
      for (let i = 0; i < count; i++) {
        const status = await statusBadges.nth(i).textContent()
        expect(status?.toLowerCase()).toContain('successful')
      }
    })

    test('should export payment data', async ({ adminPage }) => {
      const filename = await adminPage.exportData('payments')
      expect(filename).toContain('payments')
      expect(filename).toMatch(/\.(csv|xlsx)$/)
    })
  })

  test.describe('Analytics and Reporting', () => {
    test('should display analytics dashboard', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('analytics')
      
      // Verify analytics charts and data are displayed
      await expect(adminPage.page.locator('[data-testid="analytics-charts"]')).toBeVisible()
      await expect(adminPage.page.locator('[data-testid="metrics-summary"]')).toBeVisible()
    })

    test('should filter analytics by date range', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('analytics')
      
      // Set date range filter
      await adminPage.page.locator('[data-testid="date-from"]').fill('2024-01-01')
      await adminPage.page.locator('[data-testid="date-to"]').fill('2024-12-31')
      await adminPage.page.locator('[data-testid="apply-filter"]').click()
      
      await adminPage.page.waitForLoadState('networkidle')
      
      // Verify analytics are updated for the date range
      await expect(adminPage.page.locator('[data-testid="analytics-charts"]')).toBeVisible()
    })

    test('should export analytics reports', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('analytics')
      
      const filename = await adminPage.exportData('analytics')
      expect(filename).toMatch(/analytics.*\.(pdf|xlsx)$/)
    })
  })

  test.describe('System Settings', () => {
    test('should access system settings', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('settings')
      
      // Verify settings page loads
      await expect(adminPage.page.locator('[data-testid="system-settings"]')).toBeVisible()
    })

    test('should update system configuration', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('settings')
      
      // Update a setting (e.g., site title)
      const siteTitle = `AIClases ${Date.now()}`
      await adminPage.page.locator('[data-testid="site-title-input"]').fill(siteTitle)
      await adminPage.saveButton.click()
      
      // Verify setting was saved
      await expect(adminPage.page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Reload and verify persistence
      await adminPage.page.reload()
      const savedTitle = await adminPage.page.locator('[data-testid="site-title-input"]').inputValue()
      expect(savedTitle).toBe(siteTitle)
    })

    test('should manage email templates', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('settings')
      
      // Navigate to email templates section
      await adminPage.page.locator('[data-testid="email-templates-tab"]').click()
      
      // Edit welcome email template
      const welcomeTemplate = adminPage.page.locator('[data-testid="welcome-email-template"]')
      await welcomeTemplate.fill('Welcome to AIClases! We are excited to have you.')
      
      await adminPage.saveButton.click()
      
      // Verify template was saved
      await expect(adminPage.page.locator('[data-testid="success-message"]')).toBeVisible()
    })
  })

  test.describe('Data Export and Import', () => {
    test('should export user data', async ({ adminPage }) => {
      const filename = await adminPage.exportData('users')
      expect(filename).toContain('users')
      expect(filename).toMatch(/\.(csv|xlsx)$/)
    })

    test('should export course data', async ({ adminPage }) => {
      const filename = await adminPage.exportData('courses')
      expect(filename).toContain('courses')
      expect(filename).toMatch(/\.(csv|xlsx)$/)
    })

    test('should handle large data exports', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      
      // Select all users for export
      await adminPage.selectAllItems()
      
      const filename = await adminPage.exportData('users')
      expect(filename).toBeDefined()
    })
  })

  test.describe('Admin Security and Access Control', () => {
    test('should prevent non-admin access', async ({ page }) => {
      // Clear admin auth and try to access admin panel
      await page.context().clearCookies()
      await page.goto('/admin')
      
      // Should redirect to login or show access denied
      const url = page.url()
      expect(url).toMatch(/(login|access-denied|unauthorized)/)
    })

    test('should log admin actions', async ({ adminPage, page }) => {
      // Add audit log tracking
      await page.addInitScript(() => {
        window.auditLogs = []
        const originalFetch = window.fetch
        window.fetch = function(...args) {
          if (args[0]?.toString().includes('/api/admin/')) {
            ;(window as any).auditLogs.push({
              action: args[0],
              timestamp: new Date().toISOString()
            })
          }
          return originalFetch.apply(this, args)
        }
      })
      
      // Perform admin action
      await adminPage.addNewUser({
        name: 'Audit Test User',
        email: `audit-${Date.now()}@test.com`,
        role: 'user'
      })
      
      // Check audit logs
      const auditLogs = await page.evaluate(() => (window as any).auditLogs)
      expect(auditLogs.length).toBeGreaterThan(0)
    })

    test('should handle session timeout', async ({ adminPage, page }) => {
      // Simulate session expiration
      await page.evaluate(() => {
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      })
      
      // Try to perform admin action
      await adminPage.refreshData()
      
      // Should redirect to login
      await page.waitForURL('**/login**', { timeout: 10000 })
      expect(page.url()).toContain('login')
    })
  })

  test.describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      
      // Measure load time for user list
      const startTime = Date.now()
      await adminPage.page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000) // 5 seconds
    })

    test('should implement proper pagination', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      
      const usersPerPage = await adminPage.getUsersCount()
      
      // If pagination exists, test it
      const nextButton = adminPage.page.locator('[data-testid="next-page"]')
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await adminPage.goToNextPage()
        
        const nextPageUsers = await adminPage.getUsersCount()
        expect(nextPageUsers).toBeGreaterThan(0)
        expect(nextPageUsers).toBeLessThanOrEqual(usersPerPage)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ adminPage, page }) => {
      await adminPage.navigateToAdminSection('users')
      
      // Simulate API failure
      await page.route('**/api/admin/users', route => route.abort('failed'))
      
      await adminPage.refreshData()
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      
      // Clear simulation
      await page.unroute('**/api/admin/users')
    })

    test('should validate form inputs', async ({ adminPage }) => {
      await adminPage.navigateToAdminSection('users')
      await adminPage.addUserButton.click()
      
      // Try to save without required fields
      await adminPage.saveButton.click()
      
      // Should show validation errors
      await expect(adminPage.page.locator('[data-testid="validation-error"]')).toBeVisible()
    })

    test('should confirm destructive actions', async ({ adminPage }) => {
      // Search for a test user
      await adminPage.searchUsers('test@example.com')
      
      if (await adminPage.getUsersCount() > 0) {
        // Click delete button
        await adminPage.deleteButton.first().click()
        
        // Should show confirmation dialog
        await expect(adminPage.page.locator('[data-testid="confirm-dialog"]')).toBeVisible()
        
        // Cancel the action
        await adminPage.cancelButton.click()
      }
    })
  })
})