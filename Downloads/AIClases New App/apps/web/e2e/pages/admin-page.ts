import { Page, Locator } from '@playwright/test'

export class AdminPage {
  readonly page: Page
  readonly adminSidebar: Locator
  readonly dashboardLink: Locator
  readonly usersLink: Locator
  readonly coursesLink: Locator
  readonly paymentsLink: Locator
  readonly analyticsLink: Locator
  readonly settingsLink: Locator
  readonly userTable: Locator
  readonly courseTable: Locator
  readonly paymentTable: Locator
  readonly addUserButton: Locator
  readonly addCourseButton: Locator
  readonly searchInput: Locator
  readonly filterDropdown: Locator
  readonly sortDropdown: Locator
  readonly paginationControls: Locator
  readonly totalUsers: Locator
  readonly totalCourses: Locator
  readonly totalRevenue: Locator
  readonly activeUsers: Locator
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly confirmDeleteButton: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  readonly exportButton: Locator
  readonly bulkActionsDropdown: Locator
  readonly selectAllCheckbox: Locator
  readonly statusBadge: Locator
  readonly refreshButton: Locator

  constructor(page: Page) {
    this.page = page
    this.adminSidebar = page.locator('[data-testid="admin-sidebar"]')
    this.dashboardLink = page.locator('[data-testid="dashboard-link"]')
    this.usersLink = page.locator('[data-testid="users-link"]')
    this.coursesLink = page.locator('[data-testid="courses-link"]')
    this.paymentsLink = page.locator('[data-testid="payments-link"]')
    this.analyticsLink = page.locator('[data-testid="analytics-link"]')
    this.settingsLink = page.locator('[data-testid="settings-link"]')
    this.userTable = page.locator('[data-testid="user-table"]')
    this.courseTable = page.locator('[data-testid="course-table"]')
    this.paymentTable = page.locator('[data-testid="payment-table"]')
    this.addUserButton = page.locator('[data-testid="add-user-button"]')
    this.addCourseButton = page.locator('[data-testid="add-course-button"]')
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]')
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]')
    this.paginationControls = page.locator('[data-testid="pagination-controls"]')
    this.totalUsers = page.locator('[data-testid="total-users"]')
    this.totalCourses = page.locator('[data-testid="total-courses"]')
    this.totalRevenue = page.locator('[data-testid="total-revenue"]')
    this.activeUsers = page.locator('[data-testid="active-users"]')
    this.editButton = page.locator('[data-testid="edit-button"]')
    this.deleteButton = page.locator('[data-testid="delete-button"]')
    this.confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
    this.cancelButton = page.locator('[data-testid="cancel-button"]')
    this.saveButton = page.locator('[data-testid="save-button"]')
    this.exportButton = page.locator('[data-testid="export-button"]')
    this.bulkActionsDropdown = page.locator('[data-testid="bulk-actions-dropdown"]')
    this.selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]')
    this.statusBadge = page.locator('[data-testid="status-badge"]')
    this.refreshButton = page.locator('[data-testid="refresh-button"]')
  }

  async navigateToAdmin() {
    await this.page.goto('/admin')
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToAdminSection(section: 'dashboard' | 'users' | 'courses' | 'payments' | 'analytics' | 'settings') {
    switch (section) {
      case 'dashboard':
        await this.dashboardLink.click()
        break
      case 'users':
        await this.usersLink.click()
        break
      case 'courses':
        await this.coursesLink.click()
        break
      case 'payments':
        await this.paymentsLink.click()
        break
      case 'analytics':
        await this.analyticsLink.click()
        break
      case 'settings':
        await this.settingsLink.click()
        break
    }
    await this.page.waitForLoadState('networkidle')
  }

  async getDashboardStats() {
    const totalUsersText = await this.totalUsers.textContent()
    const totalCoursesText = await this.totalCourses.textContent()
    const totalRevenueText = await this.totalRevenue.textContent()
    const activeUsersText = await this.activeUsers.textContent()

    return {
      totalUsers: parseInt(totalUsersText?.replace(/\D/g, '') || '0'),
      totalCourses: parseInt(totalCoursesText?.replace(/\D/g, '') || '0'),
      totalRevenue: parseFloat(totalRevenueText?.replace(/[^\d.]/g, '') || '0'),
      activeUsers: parseInt(activeUsersText?.replace(/\D/g, '') || '0')
    }
  }

  async searchUsers(searchTerm: string) {
    await this.usersLink.click()
    await this.searchInput.fill(searchTerm)
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
  }

  async searchCourses(searchTerm: string) {
    await this.coursesLink.click()
    await this.searchInput.fill(searchTerm)
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
  }

  async filterUsers(filterType: 'active' | 'inactive' | 'premium' | 'free') {
    await this.usersLink.click()
    await this.filterDropdown.click()
    await this.page.locator(`[data-value="${filterType}"]`).click()
    await this.page.waitForLoadState('networkidle')
  }

  async sortUsers(sortBy: 'name' | 'email' | 'created' | 'lastActive') {
    await this.usersLink.click()
    await this.sortDropdown.click()
    await this.page.locator(`[data-value="${sortBy}"]`).click()
    await this.page.waitForLoadState('networkidle')
  }

  async getUsersCount() {
    await this.usersLink.click()
    const rows = await this.userTable.locator('tbody tr').count()
    return rows
  }

  async getCoursesCount() {
    await this.coursesLink.click()
    const rows = await this.courseTable.locator('tbody tr').count()
    return rows
  }

  async getPaymentsCount() {
    await this.paymentsLink.click()
    const rows = await this.paymentTable.locator('tbody tr').count()
    return rows
  }

  async addNewUser(userData: {
    name: string
    email: string
    role: 'user' | 'admin' | 'mentor'
  }) {
    await this.usersLink.click()
    await this.addUserButton.click()
    
    // Fill user form
    await this.page.locator('[data-testid="user-name-input"]').fill(userData.name)
    await this.page.locator('[data-testid="user-email-input"]').fill(userData.email)
    await this.page.locator('[data-testid="user-role-select"]').selectOption(userData.role)
    
    await this.saveButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async editUser(userEmail: string, newData: { name?: string; role?: string }) {
    await this.searchUsers(userEmail)
    const userRow = this.page.locator(`tr:has-text("${userEmail}")`)
    await userRow.locator('[data-testid="edit-button"]').click()
    
    if (newData.name) {
      await this.page.locator('[data-testid="user-name-input"]').fill(newData.name)
    }
    
    if (newData.role) {
      await this.page.locator('[data-testid="user-role-select"]').selectOption(newData.role)
    }
    
    await this.saveButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async deleteUser(userEmail: string) {
    await this.searchUsers(userEmail)
    const userRow = this.page.locator(`tr:has-text("${userEmail}")`)
    await userRow.locator('[data-testid="delete-button"]').click()
    await this.confirmDeleteButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async addNewCourse(courseData: {
    title: string
    description: string
    instructor: string
    price: number
    category: string
  }) {
    await this.coursesLink.click()
    await this.addCourseButton.click()
    
    await this.page.locator('[data-testid="course-title-input"]').fill(courseData.title)
    await this.page.locator('[data-testid="course-description-input"]').fill(courseData.description)
    await this.page.locator('[data-testid="course-instructor-input"]').fill(courseData.instructor)
    await this.page.locator('[data-testid="course-price-input"]').fill(courseData.price.toString())
    await this.page.locator('[data-testid="course-category-select"]').selectOption(courseData.category)
    
    await this.saveButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async publishCourse(courseTitle: string) {
    await this.searchCourses(courseTitle)
    const courseRow = this.page.locator(`tr:has-text("${courseTitle}")`)
    await courseRow.locator('[data-testid="publish-button"]').click()
    await this.page.waitForLoadState('networkidle')
  }

  async unpublishCourse(courseTitle: string) {
    await this.searchCourses(courseTitle)
    const courseRow = this.page.locator(`tr:has-text("${courseTitle}")`)
    await courseRow.locator('[data-testid="unpublish-button"]').click()
    await this.page.waitForLoadState('networkidle')
  }

  async viewUserDetails(userEmail: string) {
    await this.searchUsers(userEmail)
    const userRow = this.page.locator(`tr:has-text("${userEmail}")`)
    await userRow.locator('[data-testid="view-button"]').click()
    await this.page.waitForLoadState('networkidle')
  }

  async viewCourseAnalytics(courseTitle: string) {
    await this.searchCourses(courseTitle)
    const courseRow = this.page.locator(`tr:has-text("${courseTitle}")`)
    await courseRow.locator('[data-testid="analytics-button"]').click()
    await this.page.waitForLoadState('networkidle')
  }

  async exportData(dataType: 'users' | 'courses' | 'payments') {
    switch (dataType) {
      case 'users':
        await this.usersLink.click()
        break
      case 'courses':
        await this.coursesLink.click()
        break
      case 'payments':
        await this.paymentsLink.click()
        break
    }
    
    const downloadPromise = this.page.waitForEvent('download')
    await this.exportButton.click()
    const download = await downloadPromise
    return download.suggestedFilename()
  }

  async bulkDeleteUsers(userEmails: string[]) {
    await this.usersLink.click()
    
    // Select users
    for (const email of userEmails) {
      const userRow = this.page.locator(`tr:has-text("${email}")`)
      await userRow.locator('input[type="checkbox"]').check()
    }
    
    await this.bulkActionsDropdown.click()
    await this.page.locator('[data-value="delete"]').click()
    await this.confirmDeleteButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async selectAllItems() {
    await this.selectAllCheckbox.check()
  }

  async refreshData() {
    await this.refreshButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goToNextPage() {
    const nextButton = this.paginationControls.locator('[data-testid="next-page"]')
    await nextButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goToPreviousPage() {
    const prevButton = this.paginationControls.locator('[data-testid="prev-page"]')
    await prevButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getItemStatus(itemName: string) {
    const itemRow = this.page.locator(`tr:has-text("${itemName}")`)
    const statusBadge = itemRow.locator('[data-testid="status-badge"]')
    return await statusBadge.textContent()
  }

  async hasAdminAccess() {
    try {
      await this.adminSidebar.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}