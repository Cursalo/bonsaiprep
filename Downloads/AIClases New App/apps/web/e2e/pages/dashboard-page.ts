import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly creditsBalance: Locator
  readonly userAvatar: Locator
  readonly userDropdown: Locator
  readonly logoutButton: Locator
  readonly profileLink: Locator
  readonly settingsLink: Locator
  readonly enrolledCourses: Locator
  readonly availableCourses: Locator
  readonly progressCards: Locator
  readonly mentorChatButton: Locator
  readonly notificationBell: Locator
  readonly searchBar: Locator
  readonly filterDropdown: Locator
  readonly courseCard: Locator
  readonly continueButton: Locator
  readonly enrollButton: Locator
  readonly upgradeButton: Locator
  readonly languageSelector: Locator
  readonly themeToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.creditsBalance = page.locator('[data-testid="credits-balance"]')
    this.userAvatar = page.locator('[data-testid="user-avatar"]')
    this.userDropdown = page.locator('[data-testid="user-dropdown"]')
    this.logoutButton = page.locator('[data-testid="logout-button"]')
    this.profileLink = page.locator('[data-testid="profile-link"]')
    this.settingsLink = page.locator('[data-testid="settings-link"]')
    this.enrolledCourses = page.locator('[data-testid="enrolled-courses"]')
    this.availableCourses = page.locator('[data-testid="available-courses"]')
    this.progressCards = page.locator('[data-testid="progress-card"]')
    this.mentorChatButton = page.locator('[data-testid="mentor-chat-button"]')
    this.notificationBell = page.locator('[data-testid="notification-bell"]')
    this.searchBar = page.locator('[data-testid="search-bar"]')
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]')
    this.courseCard = page.locator('[data-testid="course-card"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
    this.enrollButton = page.locator('[data-testid="enroll-button"]')
    this.upgradeButton = page.locator('[data-testid="upgrade-button"]')
    this.languageSelector = page.locator('[data-testid="language-selector"]')
    this.themeToggle = page.locator('[data-testid="theme-toggle"]')
  }

  async navigateToDashboard() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async getCreditsBalance() {
    await this.creditsBalance.waitFor({ state: 'visible' })
    const creditsText = await this.creditsBalance.textContent()
    return parseInt(creditsText?.replace(/\D/g, '') || '0')
  }

  async openUserDropdown() {
    await this.userAvatar.click()
    await this.userDropdown.waitFor({ state: 'visible' })
  }

  async logout() {
    await this.openUserDropdown()
    await this.logoutButton.click()
    await this.page.waitForURL('**/login', { timeout: 10000 })
  }

  async navigateToProfile() {
    await this.openUserDropdown()
    await this.profileLink.click()
  }

  async navigateToSettings() {
    await this.openUserDropdown()
    await this.settingsLink.click()
  }

  async getEnrolledCoursesCount() {
    const courses = await this.enrolledCourses.locator('.course-item').count()
    return courses
  }

  async getAvailableCoursesCount() {
    const courses = await this.availableCourses.locator('.course-item').count()
    return courses
  }

  async getCourseProgress(courseName: string) {
    const progressCard = this.page.locator(`[data-testid="progress-card-${courseName}"]`)
    const progressElement = progressCard.locator('[data-testid="course-progress"]')
    const progressValue = await progressElement.getAttribute('aria-valuenow')
    return parseInt(progressValue || '0')
  }

  async continueCourse(courseName: string) {
    const courseCard = this.page.locator(`[data-testid="course-card-${courseName}"]`)
    const continueBtn = courseCard.locator('[data-testid="continue-button"]')
    await continueBtn.click()
  }

  async enrollInCourse(courseName: string) {
    const courseCard = this.page.locator(`[data-testid="course-card-${courseName}"]`)
    const enrollBtn = courseCard.locator('[data-testid="enroll-button"]')
    await enrollBtn.click()
  }

  async searchCourses(searchTerm: string) {
    await this.searchBar.fill(searchTerm)
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
  }

  async filterCourses(filterOption: string) {
    await this.filterDropdown.click()
    await this.page.locator(`[data-value="${filterOption}"]`).click()
    await this.page.waitForLoadState('networkidle')
  }

  async openMentorChat() {
    await this.mentorChatButton.click()
    await this.page.waitForURL('**/mentor-chat', { timeout: 5000 })
  }

  async clickNotificationBell() {
    await this.notificationBell.click()
  }

  async getNotificationCount() {
    const badge = this.page.locator('[data-testid="notification-badge"]')
    if (await badge.isVisible()) {
      const count = await badge.textContent()
      return parseInt(count || '0')
    }
    return 0
  }

  async changeLanguage(language: 'en' | 'es' | 'pt') {
    await this.languageSelector.click()
    await this.page.locator(`[data-value="${language}"]`).click()
    await this.page.waitForTimeout(1000) // Wait for language change
  }

  async toggleTheme() {
    await this.themeToggle.click()
    await this.page.waitForTimeout(500) // Wait for theme transition
  }

  async clickUpgrade() {
    await this.upgradeButton.click()
  }

  async waitForDashboardLoad() {
    await this.creditsBalance.waitFor({ state: 'visible' })
    await this.userAvatar.waitFor({ state: 'visible' })
  }

  async isEnrolledInCourse(courseName: string) {
    const enrollmentBadge = this.page.locator(`[data-testid="enrollment-badge-${courseName}"]`)
    return await enrollmentBadge.isVisible()
  }

  async getCoursesByCategory(category: string) {
    const categorySection = this.page.locator(`[data-testid="category-${category}"]`)
    const courses = await categorySection.locator('.course-item').count()
    return courses
  }

  async getRecentActivity() {
    const activitySection = this.page.locator('[data-testid="recent-activity"]')
    const activities = await activitySection.locator('.activity-item').count()
    return activities
  }

  async hasWelcomeMessage() {
    const welcomeMessage = this.page.locator('[data-testid="welcome-message"]')
    return await welcomeMessage.isVisible()
  }
}