import { Page, Locator } from '@playwright/test'

export class MentorChatPage {
  readonly page: Page
  readonly chatContainer: Locator
  readonly messageInput: Locator
  readonly sendButton: Locator
  readonly chatMessages: Locator
  readonly userMessage: Locator
  readonly mentorMessage: Locator
  readonly typingIndicator: Locator
  readonly creditsBalance: Locator
  readonly creditsWarning: Locator
  readonly chatHistory: Locator
  readonly newChatButton: Locator
  readonly clearChatButton: Locator
  readonly exportChatButton: Locator
  readonly chatSettings: Locator
  readonly mentorPersonality: Locator
  readonly chatLanguage: Locator
  readonly messageTimestamp: Locator
  readonly characterCount: Locator
  readonly attachFileButton: Locator
  readonly voiceInputButton: Locator
  readonly suggestedQuestions: Locator
  readonly chatTitle: Locator
  readonly saveChatButton: Locator
  readonly loadingSpinner: Locator
  readonly errorMessage: Locator
  readonly retryButton: Locator
  readonly ratingButtons: Locator
  readonly feedbackModal: Locator

  constructor(page: Page) {
    this.page = page
    this.chatContainer = page.locator('[data-testid="chat-container"]')
    this.messageInput = page.locator('[data-testid="message-input"]')
    this.sendButton = page.locator('[data-testid="send-button"]')
    this.chatMessages = page.locator('[data-testid="chat-messages"]')
    this.userMessage = page.locator('[data-testid="user-message"]')
    this.mentorMessage = page.locator('[data-testid="mentor-message"]')
    this.typingIndicator = page.locator('[data-testid="typing-indicator"]')
    this.creditsBalance = page.locator('[data-testid="credits-balance"]')
    this.creditsWarning = page.locator('[data-testid="credits-warning"]')
    this.chatHistory = page.locator('[data-testid="chat-history"]')
    this.newChatButton = page.locator('[data-testid="new-chat-button"]')
    this.clearChatButton = page.locator('[data-testid="clear-chat-button"]')
    this.exportChatButton = page.locator('[data-testid="export-chat-button"]')
    this.chatSettings = page.locator('[data-testid="chat-settings"]')
    this.mentorPersonality = page.locator('[data-testid="mentor-personality"]')
    this.chatLanguage = page.locator('[data-testid="chat-language"]')
    this.messageTimestamp = page.locator('[data-testid="message-timestamp"]')
    this.characterCount = page.locator('[data-testid="character-count"]')
    this.attachFileButton = page.locator('[data-testid="attach-file-button"]')
    this.voiceInputButton = page.locator('[data-testid="voice-input-button"]')
    this.suggestedQuestions = page.locator('[data-testid="suggested-questions"]')
    this.chatTitle = page.locator('[data-testid="chat-title"]')
    this.saveChatButton = page.locator('[data-testid="save-chat-button"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.retryButton = page.locator('[data-testid="retry-button"]')
    this.ratingButtons = page.locator('[data-testid="rating-buttons"]')
    this.feedbackModal = page.locator('[data-testid="feedback-modal"]')
  }

  async navigateToMentorChat() {
    await this.page.goto('/mentor-chat')
    await this.page.waitForLoadState('networkidle')
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message)
    await this.sendButton.click()
  }

  async sendMessageAndWaitForResponse(message: string) {
    await this.sendMessage(message)
    await this.waitForMentorResponse()
  }

  async waitForMentorResponse() {
    // Wait for typing indicator to appear
    await this.typingIndicator.waitFor({ state: 'visible', timeout: 5000 })
    
    // Wait for typing indicator to disappear (response is ready)
    await this.typingIndicator.waitFor({ state: 'hidden', timeout: 30000 })
    
    // Wait for the new mentor message to appear
    await this.mentorMessage.last().waitFor({ state: 'visible' })
  }

  async getLastMentorResponse() {
    const lastMessage = this.mentorMessage.last()
    return await lastMessage.textContent()
  }

  async getLastUserMessage() {
    const lastMessage = this.userMessage.last()
    return await lastMessage.textContent()
  }

  async getChatMessagesCount() {
    const userMessages = await this.userMessage.count()
    const mentorMessages = await this.mentorMessage.count()
    return { userMessages, mentorMessages, total: userMessages + mentorMessages }
  }

  async getCreditsBalance() {
    const creditsText = await this.creditsBalance.textContent()
    return parseInt(creditsText?.replace(/\D/g, '') || '0')
  }

  async isCreditsWarningVisible() {
    return await this.creditsWarning.isVisible()
  }

  async startNewChat() {
    await this.newChatButton.click()
    await this.page.waitForTimeout(1000)
  }

  async clearCurrentChat() {
    await this.clearChatButton.click()
    await this.page.waitForTimeout(1000)
  }

  async exportChat() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.exportChatButton.click()
    const download = await downloadPromise
    return download.suggestedFilename()
  }

  async openChatSettings() {
    await this.chatSettings.click()
    await this.page.waitForTimeout(500)
  }

  async changeMentorPersonality(personality: 'friendly' | 'professional' | 'casual' | 'technical') {
    await this.openChatSettings()
    await this.mentorPersonality.selectOption(personality)
    await this.page.waitForTimeout(1000)
  }

  async changeChatLanguage(language: 'en' | 'es' | 'pt') {
    await this.openChatSettings()
    await this.chatLanguage.selectOption(language)
    await this.page.waitForTimeout(1000)
  }

  async getCharacterCount() {
    const countText = await this.characterCount.textContent()
    return parseInt(countText?.match(/\d+/)?.[0] || '0')
  }

  async attachFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    await this.page.waitForTimeout(1000)
  }

  async startVoiceInput() {
    await this.voiceInputButton.click()
    await this.page.waitForTimeout(2000) // Wait for voice input to start
  }

  async clickSuggestedQuestion(questionIndex: number) {
    const question = this.suggestedQuestions.locator('.suggested-question').nth(questionIndex)
    await question.click()
    await this.waitForMentorResponse()
  }

  async getSuggestedQuestionsCount() {
    const questions = await this.suggestedQuestions.locator('.suggested-question').count()
    return questions
  }

  async saveChatWithTitle(title: string) {
    await this.saveChatButton.click()
    await this.page.locator('[data-testid="chat-title-input"]').fill(title)
    await this.page.locator('[data-testid="save-confirm-button"]').click()
    await this.page.waitForTimeout(1000)
  }

  async loadPreviousChat(chatTitle: string) {
    await this.chatHistory.click()
    const chatItem = this.page.locator(`[data-testid="chat-item-${chatTitle}"]`)
    await chatItem.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getChatHistoryCount() {
    await this.chatHistory.click()
    const chats = await this.page.locator('.chat-history-item').count()
    return chats
  }

  async rateMentorResponse(rating: 1 | 2 | 3 | 4 | 5) {
    const lastMentorMessage = this.mentorMessage.last()
    const ratingButton = lastMentorMessage.locator(`[data-rating="${rating}"]`)
    await ratingButton.click()
  }

  async provideFeedback(feedback: string) {
    await this.page.locator('[data-testid="feedback-button"]').click()
    await this.feedbackModal.waitFor({ state: 'visible' })
    await this.page.locator('[data-testid="feedback-input"]').fill(feedback)
    await this.page.locator('[data-testid="submit-feedback-button"]').click()
    await this.feedbackModal.waitFor({ state: 'hidden' })
  }

  async retryLastMessage() {
    await this.retryButton.click()
    await this.waitForMentorResponse()
  }

  async isMessageInputDisabled() {
    return await this.messageInput.isDisabled()
  }

  async isSendButtonDisabled() {
    return await this.sendButton.isDisabled()
  }

  async waitForErrorMessage() {
    await this.errorMessage.waitFor({ state: 'visible' })
    return await this.errorMessage.textContent()
  }

  async getMessageTimestamp(messageIndex: number) {
    const timestamp = this.messageTimestamp.nth(messageIndex)
    return await timestamp.textContent()
  }

  async scrollToTop() {
    await this.chatContainer.evaluate(el => el.scrollTop = 0)
  }

  async scrollToBottom() {
    await this.chatContainer.evaluate(el => el.scrollTop = el.scrollHeight)
  }

  async isChatEmpty() {
    const messagesCount = await this.getChatMessagesCount()
    return messagesCount.total === 0
  }

  async waitForChatToLoad() {
    await this.chatContainer.waitFor({ state: 'visible' })
    await this.messageInput.waitFor({ state: 'visible' })
    await this.creditsBalance.waitFor({ state: 'visible' })
  }

  async hasInsufficientCredits() {
    const balance = await this.getCreditsBalance()
    return balance <= 0 || await this.isCreditsWarningVisible()
  }

  async simulateNetworkError() {
    // Simulate network failure during chat
    await this.page.route('**/api/mentor/**', route => {
      route.abort('failed')
    })
  }

  async clearNetworkSimulation() {
    await this.page.unroute('**/api/mentor/**')
  }
}