import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly registerLink: Locator
  readonly forgotPasswordLink: Locator
  readonly googleLoginButton: Locator
  readonly facebookLoginButton: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.registerLink = page.locator('[data-testid="register-link"]')
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]')
    this.googleLoginButton = page.locator('[data-testid="google-login-button"]')
    this.facebookLoginButton = page.locator('[data-testid="facebook-login-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
  }

  async navigateToLogin() {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async clickLogin() {
    await this.loginButton.click()
  }

  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.clickLogin()
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password)
    await this.page.waitForURL('**/dashboard', { timeout: 10000 })
  }

  async clickRegisterLink() {
    await this.registerLink.click()
  }

  async clickForgotPasswordLink() {
    await this.forgotPasswordLink.click()
  }

  async clickGoogleLogin() {
    await this.googleLoginButton.click()
  }

  async clickFacebookLogin() {
    await this.facebookLoginButton.click()
  }

  async waitForErrorMessage() {
    await this.errorMessage.waitFor({ state: 'visible' })
    return await this.errorMessage.textContent()
  }

  async waitForSuccessMessage() {
    await this.successMessage.waitFor({ state: 'visible' })
    return await this.successMessage.textContent()
  }

  async waitForLoading() {
    await this.loadingSpinner.waitFor({ state: 'visible' })
  }

  async waitForLoadingToDisappear() {
    await this.loadingSpinner.waitFor({ state: 'hidden' })
  }

  async isLoggedIn() {
    // Check if we're redirected to dashboard or if login form is gone
    try {
      await this.page.waitForURL('**/dashboard', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async getValidationError(field: 'email' | 'password') {
    const fieldError = this.page.locator(`[data-testid="${field}-error"]`)
    if (await fieldError.isVisible()) {
      return await fieldError.textContent()
    }
    return null
  }

  async clearForm() {
    await this.emailInput.clear()
    await this.passwordInput.clear()
  }

  async isFormValid() {
    const emailValue = await this.emailInput.inputValue()
    const passwordValue = await this.passwordInput.inputValue()
    const loginButtonEnabled = await this.loginButton.isEnabled()
    
    return emailValue.length > 0 && passwordValue.length > 0 && loginButtonEnabled
  }
}