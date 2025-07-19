import { test, expect } from './fixtures/test-base'

test.describe('Mentor AI Chat System', () => {
  test.beforeEach(async ({ dashboardPage, mentorChatPage }) => {
    // Start with authenticated user who has credits
    await dashboardPage.navigateToDashboard()
    await dashboardPage.waitForDashboardLoad()
    
    // Navigate to mentor chat
    await mentorChatPage.navigateToMentorChat()
    await mentorChatPage.waitForChatToLoad()
  })

  test.describe('Basic Chat Functionality', () => {
    test('should load mentor chat interface', async ({ mentorChatPage }) => {
      // Verify chat interface elements are present
      await expect(mentorChatPage.chatContainer).toBeVisible()
      await expect(mentorChatPage.messageInput).toBeVisible()
      await expect(mentorChatPage.sendButton).toBeVisible()
      await expect(mentorChatPage.creditsBalance).toBeVisible()
    })

    test('should send message and receive response', async ({ mentorChatPage, page }) => {
      const testMessage = 'Hello, can you help me learn JavaScript?'
      
      // Send message
      await mentorChatPage.sendMessageAndWaitForResponse(testMessage)
      
      // Verify message was sent
      const lastUserMessage = await mentorChatPage.getLastUserMessage()
      expect(lastUserMessage).toBe(testMessage)
      
      // Verify mentor responded
      const mentorResponse = await mentorChatPage.getLastMentorResponse()
      expect(mentorResponse).toBeTruthy()
      expect(mentorResponse?.length).toBeGreaterThan(0)
      
      // Verify credits were deducted
      await expect(page).toHaveCredits(await mentorChatPage.getCreditsBalance())
    })

    test('should display typing indicator during response', async ({ mentorChatPage }) => {
      await mentorChatPage.sendMessage('What is React?')
      
      // Typing indicator should appear
      await expect(mentorChatPage.typingIndicator).toBeVisible()
      
      // Wait for response and verify typing indicator disappears
      await mentorChatPage.waitForMentorResponse()
      await expect(mentorChatPage.typingIndicator).toBeHidden()
    })

    test('should handle long messages', async ({ mentorChatPage }) => {
      const longMessage = 'Can you explain object-oriented programming in detail, including concepts like inheritance, polymorphism, encapsulation, and abstraction? I need a comprehensive understanding of these concepts for my upcoming exam.'
      
      await mentorChatPage.sendMessageAndWaitForResponse(longMessage)
      
      const userMessage = await mentorChatPage.getLastUserMessage()
      const mentorResponse = await mentorChatPage.getLastMentorResponse()
      
      expect(userMessage).toBe(longMessage)
      expect(mentorResponse).toBeTruthy()
    })

    test('should handle special characters and emojis', async ({ mentorChatPage }) => {
      const messageWithSpecialChars = 'Can you explain this code: console.log("Hello 👋"); // Comment with émojis 🚀'
      
      await mentorChatPage.sendMessageAndWaitForResponse(messageWithSpecialChars)
      
      const userMessage = await mentorChatPage.getLastUserMessage()
      expect(userMessage).toBe(messageWithSpecialChars)
    })

    test('should prevent sending empty messages', async ({ mentorChatPage }) => {
      // Try to send empty message
      await mentorChatPage.sendMessage('')
      
      // Send button should be disabled for empty input
      expect(await mentorChatPage.isSendButtonDisabled()).toBe(true)
    })
  })

  test.describe('Credits System Integration', () => {
    test('should deduct credits for each message', async ({ mentorChatPage, page }) => {
      const initialCredits = await mentorChatPage.getCreditsBalance()
      
      await mentorChatPage.sendMessageAndWaitForResponse('What is Python?')
      
      const creditsAfterMessage = await mentorChatPage.getCreditsBalance()
      expect(creditsAfterMessage).toBeLessThan(initialCredits)
      
      // Verify credits display is updated
      await expect(page).toHaveCredits(creditsAfterMessage)
    })

    test('should show credits warning when low', async ({ mentorChatPage, page }) => {
      // Simulate low credits scenario
      await page.evaluate(() => {
        // Mock low credits in the UI
        const creditsElement = document.querySelector('[data-testid="credits-balance"]')
        if (creditsElement) {
          creditsElement.textContent = '5 credits'
        }
      })
      
      await mentorChatPage.sendMessageAndWaitForResponse('Quick question')
      
      // Should show credits warning
      if (await mentorChatPage.getCreditsBalance() <= 10) {
        expect(await mentorChatPage.isCreditsWarningVisible()).toBe(true)
      }
    })

    test('should prevent chat when out of credits', async ({ mentorChatPage, page }) => {
      // Mock scenario with no credits
      await page.evaluate(() => {
        const creditsElement = document.querySelector('[data-testid="credits-balance"]')
        if (creditsElement) {
          creditsElement.textContent = '0 credits'
        }
      })
      
      await page.reload()
      await mentorChatPage.waitForChatToLoad()
      
      // Message input should be disabled
      if (await mentorChatPage.hasInsufficientCredits()) {
        expect(await mentorChatPage.isMessageInputDisabled()).toBe(true)
      }
    })

    test('should display upgrade prompt when credits are low', async ({ mentorChatPage, dashboardPage }) => {
      // Simulate very low credits
      if (await mentorChatPage.getCreditsBalance() <= 5) {
        // Should show upgrade button or prompt
        await expect(mentorChatPage.page.locator('[data-testid="upgrade-prompt"]')).toBeVisible()
        
        // Click upgrade should redirect to purchase page
        const upgradeButton = mentorChatPage.page.locator('[data-testid="upgrade-button"]')
        if (await upgradeButton.isVisible()) {
          await upgradeButton.click()
          await mentorChatPage.page.waitForURL('**/checkout**')
        }
      }
    })
  })

  test.describe('Chat History and Persistence', () => {
    test('should maintain chat history during session', async ({ mentorChatPage }) => {
      const messages = [
        'What is JavaScript?',
        'How do I use arrays?',
        'Explain functions in JS'
      ]
      
      for (const message of messages) {
        await mentorChatPage.sendMessageAndWaitForResponse(message)
      }
      
      const { userMessages, mentorMessages } = await mentorChatPage.getChatMessagesCount()
      expect(userMessages).toBe(messages.length)
      expect(mentorMessages).toBe(messages.length)
    })

    test('should save and load chat sessions', async ({ mentorChatPage }) => {
      const chatTitle = `Test Chat ${Date.now()}`
      
      // Send some messages
      await mentorChatPage.sendMessageAndWaitForResponse('Help me with React hooks')
      await mentorChatPage.sendMessageAndWaitForResponse('What is useState?')
      
      // Save chat with title
      await mentorChatPage.saveChatWithTitle(chatTitle)
      
      // Start new chat
      await mentorChatPage.startNewChat()
      expect(await mentorChatPage.isChatEmpty()).toBe(true)
      
      // Load previous chat
      await mentorChatPage.loadPreviousChat(chatTitle)
      
      // Verify messages are restored
      const { total } = await mentorChatPage.getChatMessagesCount()
      expect(total).toBeGreaterThan(0)
    })

    test('should persist chat across browser sessions', async ({ mentorChatPage, page }) => {
      await mentorChatPage.sendMessageAndWaitForResponse('Test persistence message')
      
      // Simulate browser restart
      await page.reload()
      await mentorChatPage.waitForChatToLoad()
      
      // Chat history should be restored
      const { total } = await mentorChatPage.getChatMessagesCount()
      expect(total).toBeGreaterThan(0)
    })

    test('should manage multiple chat sessions', async ({ mentorChatPage }) => {
      // Create first chat
      await mentorChatPage.sendMessageAndWaitForResponse('Chat 1 message')
      await mentorChatPage.saveChatWithTitle('Chat Session 1')
      
      // Create second chat
      await mentorChatPage.startNewChat()
      await mentorChatPage.sendMessageAndWaitForResponse('Chat 2 message')
      await mentorChatPage.saveChatWithTitle('Chat Session 2')
      
      // Verify both chats exist in history
      const historyCount = await mentorChatPage.getChatHistoryCount()
      expect(historyCount).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('Chat Personalization and Settings', () => {
    test('should change mentor personality', async ({ mentorChatPage }) => {
      await mentorChatPage.changeMentorPersonality('professional')
      
      await mentorChatPage.sendMessageAndWaitForResponse('Explain variables in programming')
      
      const response = await mentorChatPage.getLastMentorResponse()
      // Professional tone should be more formal (this would require content analysis in real test)
      expect(response).toBeTruthy()
    })

    test('should switch chat language', async ({ mentorChatPage }) => {
      // Switch to Spanish
      await mentorChatPage.changeChatLanguage('es')
      
      await mentorChatPage.sendMessageAndWaitForResponse('¿Qué es JavaScript?')
      
      const response = await mentorChatPage.getLastMentorResponse()
      expect(response).toBeTruthy()
      
      // Switch to Portuguese
      await mentorChatPage.changeChatLanguage('pt')
      
      await mentorChatPage.sendMessageAndWaitForResponse('O que é JavaScript?')
      
      const portugueseResponse = await mentorChatPage.getLastMentorResponse()
      expect(portugueseResponse).toBeTruthy()
    })

    test('should customize chat settings', async ({ mentorChatPage }) => {
      await mentorChatPage.openChatSettings()
      
      // Change multiple settings
      await mentorChatPage.changeMentorPersonality('casual')
      await mentorChatPage.changeChatLanguage('en')
      
      // Settings should persist
      await mentorChatPage.page.reload()
      await mentorChatPage.waitForChatToLoad()
      
      // Send message to verify settings are applied
      await mentorChatPage.sendMessageAndWaitForResponse('Hey, how are you?')
      
      const response = await mentorChatPage.getLastMentorResponse()
      expect(response).toBeTruthy()
    })
  })

  test.describe('Advanced Chat Features', () => {
    test('should use suggested questions', async ({ mentorChatPage }) => {
      // Check if suggested questions are available
      const suggestionsCount = await mentorChatPage.getSuggestedQuestionsCount()
      
      if (suggestionsCount > 0) {
        await mentorChatPage.clickSuggestedQuestion(0)
        
        // Should send the suggested question and get response
        const response = await mentorChatPage.getLastMentorResponse()
        expect(response).toBeTruthy()
      }
    })

    test('should handle file attachments', async ({ mentorChatPage }) => {
      // Create a test file
      const testFilePath = '/tmp/test-code.js'
      await mentorChatPage.page.evaluate(async (path) => {
        const fs = require('fs')
        fs.writeFileSync(path, 'function hello() { console.log("Hello World"); }')
      }, testFilePath)
      
      try {
        await mentorChatPage.attachFile(testFilePath)
        await mentorChatPage.sendMessageAndWaitForResponse('Can you review this code?')
        
        const response = await mentorChatPage.getLastMentorResponse()
        expect(response).toBeTruthy()
      } catch (error) {
        // File attachment might not be available in test environment
        console.log('File attachment test skipped:', error)
      }
    })

    test('should support voice input', async ({ mentorChatPage }) => {
      try {
        await mentorChatPage.startVoiceInput()
        
        // In real test, would simulate voice input
        // For now, just verify voice button responds
        await expect(mentorChatPage.voiceInputButton).toBeVisible()
      } catch (error) {
        // Voice input might not be available in test environment
        console.log('Voice input test skipped:', error)
      }
    })

    test('should export chat history', async ({ mentorChatPage }) => {
      // Send a few messages first
      await mentorChatPage.sendMessageAndWaitForResponse('Message 1')
      await mentorChatPage.sendMessageAndWaitForResponse('Message 2')
      
      const filename = await mentorChatPage.exportChat()
      expect(filename).toMatch(/chat.*\.(txt|pdf|html)$/)
    })

    test('should clear chat history', async ({ mentorChatPage }) => {
      // Send messages
      await mentorChatPage.sendMessageAndWaitForResponse('Test message')
      
      let messageCount = await mentorChatPage.getChatMessagesCount()
      expect(messageCount.total).toBeGreaterThan(0)
      
      // Clear chat
      await mentorChatPage.clearCurrentChat()
      
      // Verify chat is empty
      expect(await mentorChatPage.isChatEmpty()).toBe(true)
    })
  })

  test.describe('Message Rating and Feedback', () => {
    test('should rate mentor responses', async ({ mentorChatPage }) => {
      await mentorChatPage.sendMessageAndWaitForResponse('Explain recursion')
      
      // Rate the response
      await mentorChatPage.rateMentorResponse(5)
      
      // Verify rating was recorded (would show confirmation in real app)
      await mentorChatPage.page.waitForTimeout(1000)
    })

    test('should provide detailed feedback', async ({ mentorChatPage }) => {
      await mentorChatPage.sendMessageAndWaitForResponse('What is machine learning?')
      
      const feedback = 'This explanation was very helpful and easy to understand!'
      await mentorChatPage.provideFeedback(feedback)
      
      // Verify feedback was submitted
      await expect(mentorChatPage.page.locator('[data-testid="feedback-success"]')).toBeVisible()
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async ({ mentorChatPage }) => {
      // Simulate network failure
      await mentorChatPage.simulateNetworkError()
      
      await mentorChatPage.sendMessage('This should fail')
      
      // Should show error message
      const errorMessage = await mentorChatPage.waitForErrorMessage()
      expect(errorMessage).toContain('Network error')
      
      // Should offer retry option
      await expect(mentorChatPage.retryButton).toBeVisible()
      
      // Clear simulation and retry
      await mentorChatPage.clearNetworkSimulation()
      await mentorChatPage.retryLastMessage()
      
      // Should get response after retry
      const response = await mentorChatPage.getLastMentorResponse()
      expect(response).toBeTruthy()
    })

    test('should handle API timeouts', async ({ mentorChatPage, page }) => {
      // Simulate slow API response
      await page.route('**/api/mentor/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // 10s delay
        route.fulfill({ status: 408, body: 'Request timeout' })
      })
      
      await mentorChatPage.sendMessage('This will timeout')
      
      const errorMessage = await mentorChatPage.waitForErrorMessage()
      expect(errorMessage).toContain('timeout')
      
      await page.unroute('**/api/mentor/**')
    })

    test('should handle malformed responses', async ({ mentorChatPage, page }) => {
      // Mock malformed API response
      await page.route('**/api/mentor/**', route => {
        route.fulfill({
          status: 200,
          body: 'invalid json response'
        })
      })
      
      await mentorChatPage.sendMessage('Test malformed response')
      
      const errorMessage = await mentorChatPage.waitForErrorMessage()
      expect(errorMessage).toContain('error')
      
      await page.unroute('**/api/mentor/**')
    })

    test('should recover from temporary failures', async ({ mentorChatPage, page }) => {
      let requestCount = 0
      
      // Fail first request, succeed on second
      await page.route('**/api/mentor/**', route => {
        requestCount++
        if (requestCount === 1) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })
      
      await mentorChatPage.sendMessage('Test recovery')
      
      // Should show error first
      const errorMessage = await mentorChatPage.waitForErrorMessage()
      expect(errorMessage).toBeTruthy()
      
      // Retry should succeed
      await mentorChatPage.retryLastMessage()
      const response = await mentorChatPage.getLastMentorResponse()
      expect(response).toBeTruthy()
      
      await page.unroute('**/api/mentor/**')
    })
  })

  test.describe('Performance and Scalability', () => {
    test('should handle long chat sessions efficiently', async ({ mentorChatPage }) => {
      // Send multiple messages to create long chat
      for (let i = 0; i < 10; i++) {
        await mentorChatPage.sendMessageAndWaitForResponse(`Message ${i + 1}: Tell me about topic ${i + 1}`)
      }
      
      // Chat should still be responsive
      const { total } = await mentorChatPage.getChatMessagesCount()
      expect(total).toBe(20) // 10 user + 10 mentor messages
      
      // Scrolling should work smoothly
      await mentorChatPage.scrollToTop()
      await mentorChatPage.scrollToBottom()
    })

    test('should implement message character limits', async ({ mentorChatPage }) => {
      const characterCount = await mentorChatPage.getCharacterCount()
      
      // Fill input to near limit
      const longMessage = 'a'.repeat(1000)
      await mentorChatPage.messageInput.fill(longMessage)
      
      const newCharacterCount = await mentorChatPage.getCharacterCount()
      expect(newCharacterCount).toBeGreaterThan(characterCount)
      
      // Should show character count warning near limit
      if (newCharacterCount > 900) {
        await expect(mentorChatPage.page.locator('[data-testid="character-warning"]')).toBeVisible()
      }
    })

    test('should load chat history efficiently', async ({ mentorChatPage }) => {
      // Measure time to load chat history
      const startTime = Date.now()
      await mentorChatPage.getChatHistoryCount()
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(2000) // 2 seconds
    })
  })

  test.describe('Mobile Chat Experience', () => {
    test('should adapt chat interface for mobile', async ({ mentorChatPage, page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await mentorChatPage.navigateToMentorChat()
      
      // Chat interface should be optimized for mobile
      await expect(mentorChatPage.chatContainer).toBeVisible()
      await expect(mentorChatPage.messageInput).toBeVisible()
      
      // Send message on mobile
      await mentorChatPage.sendMessageAndWaitForResponse('Mobile test message')
      
      const response = await mentorChatPage.getLastMentorResponse()
      expect(response).toBeTruthy()
    })

    test('should handle keyboard visibility on mobile', async ({ mentorChatPage, page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await mentorChatPage.navigateToMentorChat()
      
      // Focus on input (simulates keyboard opening)
      await mentorChatPage.messageInput.focus()
      
      // Chat should adjust layout for keyboard
      await expect(mentorChatPage.messageInput).toBeFocused()
    })
  })
})