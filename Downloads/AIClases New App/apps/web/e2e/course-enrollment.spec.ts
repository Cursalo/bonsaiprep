import { test, expect } from './fixtures/test-base'

test.describe('Course Enrollment and Payment Flows', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    // Start each test with authenticated user
    await dashboardPage.navigateToDashboard()
    await dashboardPage.waitForDashboardLoad()
  })

  test.describe('Course Discovery and Browsing', () => {
    test('should display available courses on dashboard', async ({ dashboardPage }) => {
      const coursesCount = await dashboardPage.getAvailableCoursesCount()
      expect(coursesCount).toBeGreaterThan(0)
      
      // Verify course cards are visible
      await expect(dashboardPage.courseCard.first()).toBeVisible()
    })

    test('should search for courses', async ({ dashboardPage }) => {
      await dashboardPage.searchCourses('JavaScript')
      
      // Wait for search results
      await dashboardPage.page.waitForLoadState('networkidle')
      
      // Verify search results contain the search term
      const firstCourseTitle = await dashboardPage.courseCard.first().locator('[data-testid="course-title"]').textContent()
      expect(firstCourseTitle?.toLowerCase()).toContain('javascript')
    })

    test('should filter courses by category', async ({ dashboardPage }) => {
      await dashboardPage.filterCourses('programming')
      
      const programmingCourses = await dashboardPage.getCoursesByCategory('programming')
      expect(programmingCourses).toBeGreaterThan(0)
    })

    test('should navigate to course details page', async ({ dashboardPage, coursePage }) => {
      // Click on first available course
      await dashboardPage.courseCard.first().click()
      
      // Verify navigation to course page
      await coursePage.page.waitForURL('**/courses/**')
      expect(coursePage.page.url()).toContain('/courses/')
      
      // Verify course details are loaded
      await expect(coursePage.courseTitle).toBeVisible()
      await expect(coursePage.courseDescription).toBeVisible()
    })
  })

  test.describe('Course Details and Enrollment', () => {
    test('should display comprehensive course information', async ({ coursePage }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Verify all course details are present
      await expect(coursePage.courseTitle).toBeVisible()
      await expect(coursePage.courseDescription).toBeVisible()
      await expect(coursePage.courseInstructor).toBeVisible()
      await expect(coursePage.courseDuration).toBeVisible()
      await expect(coursePage.courseRating).toBeVisible()
      
      // Check lessons list
      const lessonsCount = await coursePage.getLessonsCount()
      expect(lessonsCount).toBeGreaterThan(0)
    })

    test('should enroll in free course successfully', async ({ coursePage, dashboardPage, page }) => {
      await coursePage.navigateToCourse('free-course-1')
      
      // Check initial enrollment status
      await expect(page).not.toBeEnrolledInCourse('free-course-1')
      
      // Enroll in course
      await coursePage.enrollInCourse()
      
      // Verify enrollment success
      await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible()
      await expect(page).toBeEnrolledInCourse('free-course-1')
      
      // Navigate back to dashboard and verify enrollment
      await dashboardPage.navigateToDashboard()
      const enrolledCount = await dashboardPage.getEnrolledCoursesCount()
      expect(enrolledCount).toBeGreaterThan(0)
    })

    test('should start enrolled course', async ({ coursePage, dashboardPage }) => {
      // Ensure user is enrolled in a course
      await dashboardPage.enrollInCourse('test-course-1')
      
      await coursePage.navigateToCourse('test-course-1')
      await coursePage.startCourse()
      
      // Verify navigation to first lesson
      expect(coursePage.page.url()).toContain('/lessons/')
      await expect(coursePage.currentLesson).toBeVisible()
    })

    test('should continue course from dashboard', async ({ dashboardPage, coursePage }) => {
      // Enroll and start a course first
      await dashboardPage.enrollInCourse('test-course-1')
      
      // Continue course from dashboard
      await dashboardPage.continueCourse('test-course-1')
      
      // Verify navigation to course
      await coursePage.page.waitForURL('**/courses/test-course-1**')
      expect(coursePage.page.url()).toContain('/courses/test-course-1')
    })
  })

  test.describe('Premium Course Enrollment with Payment', () => {
    test('should redirect to checkout for premium course', async ({ coursePage, checkoutPage }) => {
      await coursePage.navigateToCourse('premium-course-1')
      
      // Try to enroll in premium course
      await coursePage.enrollInCourse()
      
      // Should redirect to checkout
      await checkoutPage.page.waitForURL('**/checkout**')
      expect(checkoutPage.page.url()).toContain('/checkout')
    })

    test('should complete Stripe payment successfully', async ({ checkoutPage, dashboardPage, page }) => {
      await checkoutPage.navigateToCheckout()
      
      // Select credit package
      await checkoutPage.selectCreditPackage('standard')
      
      // Verify package selection
      const packageInfo = await checkoutPage.getSelectedPackageInfo()
      expect(packageInfo.credits).toBeGreaterThan(0)
      expect(packageInfo.price).toBeGreaterThan(0)
      
      // Complete Stripe payment
      await checkoutPage.completeStripePayment({
        cardNumber: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        cardHolder: 'Test User'
      })
      
      // Wait for payment success
      const successMessage = await checkoutPage.waitForPaymentSuccess()
      expect(successMessage).toContain('Payment successful')
      
      // Verify credits were added
      await dashboardPage.navigateToDashboard()
      const credits = await dashboardPage.getCreditsBalance()
      expect(credits).toBeGreaterThan(0)
    })

    test('should complete MercadoPago payment successfully', async ({ checkoutPage, dashboardPage }) => {
      await checkoutPage.navigateToCheckout()
      await checkoutPage.selectCreditPackage('basic')
      
      // Complete MercadoPago payment
      await checkoutPage.completeMercadoPagoPayment({
        cardNumber: '5031433215406351',
        expiry: '11/25',
        cvc: '123',
        cardHolder: 'APRO' // MercadoPago test name for approval
      })
      
      const successMessage = await checkoutPage.waitForPaymentSuccess()
      expect(successMessage).toContain('Payment successful')
      
      // Verify credits were added
      await dashboardPage.navigateToDashboard()
      const credits = await dashboardPage.getCreditsBalance()
      expect(credits).toBeGreaterThan(0)
    })

    test('should handle payment failure gracefully', async ({ checkoutPage }) => {
      await checkoutPage.navigateToCheckout()
      await checkoutPage.selectCreditPackage('basic')
      
      // Use card that will be declined
      await checkoutPage.completeStripePayment({
        cardNumber: '4000000000000002', // Stripe test card for decline
        expiry: '12/25',
        cvc: '123',
        cardHolder: 'Test User'
      })
      
      // Wait for payment error
      const errorMessage = await checkoutPage.waitForPaymentError()
      expect(errorMessage).toContain('Payment failed')
      
      // Verify retry option is available
      await expect(checkoutPage.retryButton).toBeVisible()
    })

    test('should validate payment form inputs', async ({ checkoutPage }) => {
      await checkoutPage.navigateToCheckout()
      await checkoutPage.selectCreditPackage('basic')
      
      // Test invalid card number
      const cardError = await checkoutPage.validateCardNumber('1234')
      expect(cardError).toContain('Invalid card number')
      
      // Test invalid email
      const emailError = await checkoutPage.validateEmail('invalid-email')
      expect(emailError).toContain('Invalid email format')
    })

    test('should apply discount code successfully', async ({ checkoutPage }) => {
      await checkoutPage.navigateToCheckout()
      await checkoutPage.selectCreditPackage('standard')
      
      const originalTotal = await checkoutPage.getTotalAmount()
      
      // Apply valid discount code
      await checkoutPage.applyDiscountCode('SAVE20')
      
      // Verify discount was applied
      expect(await checkoutPage.isDiscountApplied()).toBe(true)
      
      const newTotal = await checkoutPage.getTotalAmount()
      expect(newTotal).toBeLessThan(originalTotal)
    })

    test('should handle network errors during payment', async ({ checkoutPage }) => {
      await checkoutPage.navigateToCheckout()
      await checkoutPage.selectCreditPackage('basic')
      
      // Simulate network error
      await checkoutPage.simulateNetworkError()
      
      await checkoutPage.completeStripePayment({
        cardNumber: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        cardHolder: 'Test User'
      })
      
      const errorMessage = await checkoutPage.waitForPaymentError()
      expect(errorMessage).toContain('Network error')
      
      // Clear simulation and retry
      await checkoutPage.clearNetworkSimulation()
      await checkoutPage.retryPayment()
    })
  })

  test.describe('Enrollment Restrictions and Validation', () => {
    test('should prevent enrollment without sufficient credits', async ({ coursePage, dashboardPage, page }) => {
      // Ensure user has no credits
      await dashboardPage.navigateToDashboard()
      await expect(page).toHaveCredits(0)
      
      await coursePage.navigateToCourse('premium-course-1')
      await coursePage.enrollInCourse()
      
      // Should show insufficient credits message
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
      expect(errorMessage).toContain('Insufficient credits')
    })

    test('should prevent duplicate enrollment', async ({ coursePage, page }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Enroll first time
      await coursePage.enrollInCourse()
      await expect(page).toBeEnrolledInCourse('test-course-1')
      
      // Try to enroll again
      await coursePage.enrollInCourse()
      
      // Should show already enrolled message
      const message = await page.locator('[data-testid="enrollment-message"]').textContent()
      expect(message).toContain('Already enrolled')
    })

    test('should handle enrollment limits', async ({ coursePage, page }) => {
      // Navigate to course with limited seats
      await coursePage.navigateToCourse('limited-course-1')
      
      // Check if enrollment is still available
      const enrollButton = coursePage.enrollButton
      const isAvailable = await enrollButton.isEnabled()
      
      if (!isAvailable) {
        const message = await page.locator('[data-testid="enrollment-message"]').textContent()
        expect(message).toContain('Course is full')
      }
    })
  })

  test.describe('Course Access and Restrictions', () => {
    test('should enforce course prerequisites', async ({ coursePage, page }) => {
      await coursePage.navigateToCourse('advanced-course-1')
      
      // Try to enroll in advanced course without prerequisites
      await coursePage.enrollInCourse()
      
      // Should show prerequisites message
      const message = await page.locator('[data-testid="prerequisites-message"]').textContent()
      expect(message).toContain('Complete prerequisite courses')
    })

    test('should restrict access to premium content', async ({ coursePage, page }) => {
      await coursePage.navigateToCourse('premium-course-1')
      
      // Try to access lesson without enrollment
      await coursePage.selectLesson(0)
      
      // Should show access restriction
      const message = await page.locator('[data-testid="access-message"]').textContent()
      expect(message).toContain('Enroll to access')
    })

    test('should allow preview of free lessons', async ({ coursePage }) => {
      await coursePage.navigateToCourse('premium-course-1')
      
      // Should be able to access preview lesson
      await coursePage.selectLessonByTitle('Preview: Introduction')
      
      // Video should load
      expect(await coursePage.isVideoLoaded()).toBe(true)
    })
  })

  test.describe('Enrollment Analytics and Tracking', () => {
    test('should track enrollment events', async ({ coursePage, page }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Mock analytics tracking
      let analyticsEvents: any[] = []
      await page.addInitScript(() => {
        window.analytics = {
          track: (event: string, properties: any) => {
            (window as any).analyticsEvents = (window as any).analyticsEvents || []
            ;(window as any).analyticsEvents.push({ event, properties })
          }
        }
      })
      
      await coursePage.enrollInCourse()
      
      // Verify enrollment was tracked
      const events = await page.evaluate(() => (window as any).analyticsEvents)
      const enrollmentEvent = events?.find((e: any) => e.event === 'course_enrolled')
      expect(enrollmentEvent).toBeDefined()
    })

    test('should update user progress after enrollment', async ({ coursePage, dashboardPage, page }) => {
      await coursePage.navigateToCourse('test-course-1')
      await coursePage.enrollInCourse()
      
      // Check initial progress
      await expect(page).toHaveProgressPercentage(0)
      
      // Start course
      await coursePage.startCourse()
      
      // Navigate back to dashboard
      await dashboardPage.navigateToDashboard()
      
      // Verify course appears in enrolled courses
      const enrolledCount = await dashboardPage.getEnrolledCoursesCount()
      expect(enrolledCount).toBeGreaterThan(0)
    })
  })

  test.describe('Multiple Course Enrollment', () => {
    test('should enroll in multiple courses', async ({ dashboardPage, coursePage }) => {
      const coursesToEnroll = ['test-course-1', 'test-course-2', 'test-course-3']
      
      for (const courseId of coursesToEnroll) {
        await coursePage.navigateToCourse(courseId)
        await coursePage.enrollInCourse()
      }
      
      // Verify all enrollments
      await dashboardPage.navigateToDashboard()
      const enrolledCount = await dashboardPage.getEnrolledCoursesCount()
      expect(enrolledCount).toBe(coursesToEnroll.length)
    })

    test('should manage multiple course progress', async ({ dashboardPage, coursePage }) => {
      // Enroll and start multiple courses
      const courses = ['test-course-1', 'test-course-2']
      
      for (const courseId of courses) {
        await coursePage.navigateToCourse(courseId)
        await coursePage.enrollInCourse()
        await coursePage.startCourse()
        // Complete first lesson
        await coursePage.completeLesson()
      }
      
      // Check progress on dashboard
      await dashboardPage.navigateToDashboard()
      
      for (const courseId of courses) {
        const progress = await dashboardPage.getCourseProgress(courseId)
        expect(progress).toBeGreaterThan(0)
      }
    })
  })
})