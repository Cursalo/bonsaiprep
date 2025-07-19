import { test, expect } from './fixtures/test-base'

test.describe('Authentication Flows', () => {
  test.describe('Login Functionality', () => {
    test('should successfully login with valid credentials', async ({ loginPage, dashboardPage }) => {
      await loginPage.navigateToLogin()
      
      // Login with valid credentials
      await loginPage.loginAndWaitForDashboard('student@test.com', 'testpass123')
      
      // Verify successful login
      await dashboardPage.waitForDashboardLoad()
      await expect(dashboardPage.creditsBalance).toBeVisible()
      await expect(dashboardPage.userAvatar).toBeVisible()
      
      // Verify URL change
      expect(loginPage.page.url()).toContain('/dashboard')
    })

    test('should show error for invalid credentials', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      // Try to login with invalid credentials
      await loginPage.login('invalid@test.com', 'wrongpassword')
      
      // Verify error message appears
      const errorMessage = await loginPage.waitForErrorMessage()
      expect(errorMessage).toContain('Invalid credentials')
      
      // Verify we stay on login page
      expect(loginPage.page.url()).toContain('/login')
    })

    test('should show validation errors for empty fields', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      // Try to submit with empty fields
      await loginPage.clickLogin()
      
      // Verify validation errors
      const emailError = await loginPage.getValidationError('email')
      const passwordError = await loginPage.getValidationError('password')
      
      expect(emailError).toContain('Email is required')
      expect(passwordError).toContain('Password is required')
    })

    test('should show validation error for invalid email format', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      await loginPage.fillEmail('invalid-email')
      await loginPage.fillPassword('password123')
      await loginPage.clickLogin()
      
      const emailError = await loginPage.getValidationError('email')
      expect(emailError).toContain('Invalid email format')
    })

    test('should disable login button when form is invalid', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      // Check button state with empty form
      let isFormValid = await loginPage.isFormValid()
      expect(isFormValid).toBe(false)
      
      // Fill only email
      await loginPage.fillEmail('test@example.com')
      isFormValid = await loginPage.isFormValid()
      expect(isFormValid).toBe(false)
      
      // Fill both fields
      await loginPage.fillPassword('password123')
      isFormValid = await loginPage.isFormValid()
      expect(isFormValid).toBe(true)
    })

    test('should show loading state during login', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      await loginPage.fillEmail('student@test.com')
      await loginPage.fillPassword('testpass123')
      await loginPage.clickLogin()
      
      // Check loading state appears
      await loginPage.waitForLoading()
      await expect(loginPage.loadingSpinner).toBeVisible()
      
      // Wait for loading to disappear
      await loginPage.waitForLoadingToDisappear()
    })

    test('should handle network errors gracefully', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      
      // Simulate network failure
      await page.route('**/api/auth/**', route => route.abort('failed'))
      
      await loginPage.login('student@test.com', 'testpass123')
      
      const errorMessage = await loginPage.waitForErrorMessage()
      expect(errorMessage).toContain('Network error')
      
      // Clear network simulation
      await page.unroute('**/api/auth/**')
    })
  })

  test.describe('Social Login', () => {
    test('should initiate Google OAuth flow', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      
      // Mock Google OAuth response
      await page.route('**/api/auth/signin/google', route => {
        route.fulfill({
          status: 302,
          headers: { 'Location': '/dashboard' }
        })
      })
      
      await loginPage.clickGoogleLogin()
      
      // Verify redirect to OAuth provider would happen
      // (In real test, this would open OAuth popup)
    })

    test('should initiate Facebook OAuth flow', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      
      // Mock Facebook OAuth response
      await page.route('**/api/auth/signin/facebook', route => {
        route.fulfill({
          status: 302,
          headers: { 'Location': '/dashboard' }
        })
      })
      
      await loginPage.clickFacebookLogin()
    })
  })

  test.describe('Registration Flow', () => {
    test('should navigate to registration page', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      await loginPage.clickRegisterLink()
      
      await page.waitForURL('**/register')
      expect(page.url()).toContain('/register')
    })

    test('should register new user successfully', async ({ page }) => {
      await page.goto('/register')
      
      // Fill registration form
      await page.locator('[data-testid="name-input"]').fill('Test User')
      await page.locator('[data-testid="email-input"]').fill('newuser@test.com')
      await page.locator('[data-testid="password-input"]').fill('password123')
      await page.locator('[data-testid="confirm-password-input"]').fill('password123')
      await page.locator('[data-testid="terms-checkbox"]').check()
      
      await page.locator('[data-testid="register-button"]').click()
      
      // Verify successful registration
      await page.waitForURL('**/dashboard')
      expect(page.url()).toContain('/dashboard')
    })

    test('should show validation errors for mismatched passwords', async ({ page }) => {
      await page.goto('/register')
      
      await page.locator('[data-testid="password-input"]').fill('password123')
      await page.locator('[data-testid="confirm-password-input"]').fill('differentpassword')
      await page.locator('[data-testid="register-button"]').click()
      
      const passwordError = await page.locator('[data-testid="confirm-password-error"]').textContent()
      expect(passwordError).toContain('Passwords do not match')
    })

    test('should require terms acceptance', async ({ page }) => {
      await page.goto('/register')
      
      await page.locator('[data-testid="name-input"]').fill('Test User')
      await page.locator('[data-testid="email-input"]').fill('newuser@test.com')
      await page.locator('[data-testid="password-input"]').fill('password123')
      await page.locator('[data-testid="confirm-password-input"]').fill('password123')
      
      // Don't check terms
      await page.locator('[data-testid="register-button"]').click()
      
      const termsError = await page.locator('[data-testid="terms-error"]').textContent()
      expect(termsError).toContain('You must accept the terms')
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should navigate to forgot password page', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      await loginPage.clickForgotPasswordLink()
      
      await page.waitForURL('**/forgot-password')
      expect(page.url()).toContain('/forgot-password')
    })

    test('should send password reset email', async ({ page }) => {
      await page.goto('/forgot-password')
      
      await page.locator('[data-testid="email-input"]').fill('student@test.com')
      await page.locator('[data-testid="reset-button"]').click()
      
      const successMessage = await page.locator('[data-testid="success-message"]').textContent()
      expect(successMessage).toContain('Password reset email sent')
    })

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto('/forgot-password')
      
      await page.locator('[data-testid="email-input"]').fill('nonexistent@test.com')
      await page.locator('[data-testid="reset-button"]').click()
      
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
      expect(errorMessage).toContain('Email not found')
    })
  })

  test.describe('Logout Functionality', () => {
    test('should logout successfully', async ({ dashboardPage, loginPage }) => {
      // Start with authenticated user
      await dashboardPage.navigateToDashboard()
      await dashboardPage.waitForDashboardLoad()
      
      // Logout
      await dashboardPage.logout()
      
      // Verify redirect to login page
      await loginPage.page.waitForURL('**/login')
      expect(loginPage.page.url()).toContain('/login')
    })

    test('should clear authentication state on logout', async ({ dashboardPage, loginPage }) => {
      await dashboardPage.navigateToDashboard()
      await dashboardPage.logout()
      
      // Try to access protected route
      await dashboardPage.navigateToDashboard()
      
      // Should be redirected to login
      await loginPage.page.waitForURL('**/login')
      expect(loginPage.page.url()).toContain('/login')
    })
  })

  test.describe('Authentication State Persistence', () => {
    test('should maintain login state after page refresh', async ({ dashboardPage }) => {
      await dashboardPage.navigateToDashboard()
      await dashboardPage.waitForDashboardLoad()
      
      // Refresh page
      await dashboardPage.page.reload()
      
      // Should still be authenticated
      await dashboardPage.waitForDashboardLoad()
      expect(dashboardPage.page.url()).toContain('/dashboard')
    })

    test('should redirect to login when accessing protected routes while unauthenticated', async ({ page }) => {
      // Clear any existing authentication
      await page.context().clearCookies()
      
      // Try to access protected route
      await page.goto('/dashboard')
      
      // Should redirect to login
      await page.waitForURL('**/login')
      expect(page.url()).toContain('/login')
    })

    test('should redirect to intended page after login', async ({ loginPage, page }) => {
      // Clear authentication
      await page.context().clearCookies()
      
      // Try to access a specific protected route
      await page.goto('/courses/123')
      
      // Should redirect to login with return URL
      await page.waitForURL('**/login**')
      expect(page.url()).toContain('/login')
      
      // Login
      await loginPage.loginAndWaitForDashboard('student@test.com', 'testpass123')
      
      // Should redirect to originally requested page
      await page.waitForURL('**/courses/123')
      expect(page.url()).toContain('/courses/123')
    })
  })

  test.describe('Multi-device Authentication', () => {
    test('should handle concurrent logins from different devices', async ({ browser }) => {
      // Create two browser contexts (simulate different devices)
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()
      
      // Login from first device
      await page1.goto('/login')
      await page1.locator('[data-testid="email-input"]').fill('student@test.com')
      await page1.locator('[data-testid="password-input"]').fill('testpass123')
      await page1.locator('[data-testid="login-button"]').click()
      await page1.waitForURL('**/dashboard')
      
      // Login from second device with same credentials
      await page2.goto('/login')
      await page2.locator('[data-testid="email-input"]').fill('student@test.com')
      await page2.locator('[data-testid="password-input"]').fill('testpass123')
      await page2.locator('[data-testid="login-button"]').click()
      await page2.waitForURL('**/dashboard')
      
      // Both sessions should be valid
      await page1.reload()
      await page1.waitForURL('**/dashboard')
      
      await page2.reload()
      await page2.waitForURL('**/dashboard')
      
      await context1.close()
      await context2.close()
    })
  })

  test.describe('Security Features', () => {
    test('should prevent CSRF attacks', async ({ loginPage, page }) => {
      await loginPage.navigateToLogin()
      
      // Remove CSRF token from form submission
      await page.evaluate(() => {
        const csrfInput = document.querySelector('input[name="csrfToken"]')
        if (csrfInput) csrfInput.remove()
      })
      
      await loginPage.login('student@test.com', 'testpass123')
      
      // Should show CSRF error
      const errorMessage = await loginPage.waitForErrorMessage()
      expect(errorMessage).toContain('Invalid request')
    })

    test('should handle rate limiting', async ({ loginPage }) => {
      await loginPage.navigateToLogin()
      
      // Attempt multiple failed logins rapidly
      for (let i = 0; i < 6; i++) {
        await loginPage.clearForm()
        await loginPage.login('invalid@test.com', 'wrongpassword')
        await loginPage.waitForErrorMessage()
      }
      
      // Should show rate limiting message
      const errorMessage = await loginPage.waitForErrorMessage()
      expect(errorMessage).toContain('Too many attempts')
    })
  })
})