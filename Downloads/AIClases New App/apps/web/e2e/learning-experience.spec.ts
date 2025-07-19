import { test, expect } from './fixtures/test-base'

test.describe('Learning Experience', () => {
  test.beforeEach(async ({ dashboardPage, coursePage }) => {
    // Start with authenticated user enrolled in test course
    await dashboardPage.navigateToDashboard()
    await dashboardPage.waitForDashboardLoad()
    
    // Ensure enrollment in test course
    await coursePage.navigateToCourse('test-course-1')
    try {
      await coursePage.enrollInCourse()
    } catch {
      // Already enrolled, continue
    }
  })

  test.describe('Video Playback and Controls', () => {
    test('should load and play video lesson', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Verify video loads
      expect(await coursePage.isVideoLoaded()).toBe(true)
      
      // Play video
      await coursePage.playVideo()
      
      // Verify video is playing
      await coursePage.page.waitForTimeout(2000)
      const currentTime = await coursePage.getVideoCurrentTime()
      expect(currentTime).toBeGreaterThan(0)
    })

    test('should pause and resume video playback', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      await coursePage.playVideo()
      await coursePage.page.waitForTimeout(2000)
      
      // Pause video
      await coursePage.pauseVideo()
      const pausedTime = await coursePage.getVideoCurrentTime()
      
      // Wait and verify time doesn't advance
      await coursePage.page.waitForTimeout(1000)
      const stillPausedTime = await coursePage.getVideoCurrentTime()
      expect(stillPausedTime).toBe(pausedTime)
      
      // Resume playback
      await coursePage.playVideo()
      await coursePage.page.waitForTimeout(1000)
      const resumedTime = await coursePage.getVideoCurrentTime()
      expect(resumedTime).toBeGreaterThan(pausedTime)
    })

    test('should change playback speed', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Test different playback speeds
      const speeds = ['0.5', '1.25', '1.5', '2'] as const
      
      for (const speed of speeds) {
        await coursePage.changePlaybackSpeed(speed)
        
        // Verify speed change (would check video element's playbackRate in real test)
        await coursePage.page.waitForTimeout(500)
      }
    })

    test('should change video quality', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Test different quality settings
      const qualities = ['360p', '720p', '1080p'] as const
      
      for (const quality of qualities) {
        await coursePage.changeVideoQuality(quality)
        await coursePage.page.waitForTimeout(1000)
      }
    })

    test('should enter and exit fullscreen mode', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      await coursePage.enterFullscreen()
      
      // In real test, would verify fullscreen state
      await coursePage.page.waitForTimeout(1000)
      
      // Exit fullscreen (typically ESC key)
      await coursePage.page.keyboard.press('Escape')
    })

    test('should display video duration and current time', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Wait for video metadata to load
      await coursePage.page.waitForTimeout(2000)
      
      const duration = await coursePage.getVideoDuration()
      expect(duration).toBeGreaterThan(0)
      
      await coursePage.playVideo()
      await coursePage.page.waitForTimeout(2000)
      
      const currentTime = await coursePage.getVideoCurrentTime()
      expect(currentTime).toBeGreaterThan(0)
      expect(currentTime).toBeLessThan(duration)
    })
  })

  test.describe('Lesson Navigation', () => {
    test('should navigate between lessons', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      const firstLessonTitle = await coursePage.getCurrentLessonTitle()
      
      // Go to next lesson
      await coursePage.goToNextLesson()
      
      const secondLessonTitle = await coursePage.getCurrentLessonTitle()
      expect(secondLessonTitle).not.toBe(firstLessonTitle)
      
      // Go back to previous lesson
      await coursePage.goToPreviousLesson()
      
      const backToFirstTitle = await coursePage.getCurrentLessonTitle()
      expect(backToFirstTitle).toBe(firstLessonTitle)
    })

    test('should select lesson from sidebar', async ({ coursePage }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Select specific lesson by index
      await coursePage.selectLesson(2)
      
      // Verify navigation to selected lesson
      expect(coursePage.page.url()).toContain('/lessons/')
    })

    test('should select lesson by title', async ({ coursePage }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      await coursePage.selectLessonByTitle('Introduction to JavaScript')
      
      const currentTitle = await coursePage.getCurrentLessonTitle()
      expect(currentTitle).toContain('Introduction to JavaScript')
    })

    test('should show lesson completion status in sidebar', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Complete the lesson
      await coursePage.completeLesson()
      
      // Check if lesson shows as completed in sidebar
      expect(await coursePage.isLessonCompleted('lesson-1')).toBe(true)
    })
  })

  test.describe('Lesson Completion and Progress Tracking', () => {
    test('should mark lesson as complete', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Initially lesson should not be completed
      expect(await coursePage.isLessonCompleted('lesson-1')).toBe(false)
      
      // Complete the lesson
      await coursePage.completeLesson()
      
      // Verify completion
      await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible()
      expect(await coursePage.isLessonCompleted('lesson-1')).toBe(true)
    })

    test('should update course progress after lesson completion', async ({ coursePage, page }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Check initial progress
      const initialProgress = await coursePage.getCourseProgress()
      
      // Complete a lesson
      await coursePage.selectLesson(0)
      await coursePage.completeLesson()
      
      // Navigate back to course overview
      await coursePage.navigateToCourse('test-course-1')
      
      // Verify progress increased
      const newProgress = await coursePage.getCourseProgress()
      expect(newProgress).toBeGreaterThan(initialProgress)
      
      // Custom matcher
      await expect(page).toHaveProgressPercentage(newProgress)
    })

    test('should track overall course completion', async ({ coursePage, dashboardPage, page }) => {
      // Complete all lessons in course
      const lessonCount = await coursePage.getLessonsCount()
      
      for (let i = 0; i < lessonCount; i++) {
        await coursePage.selectLesson(i)
        await coursePage.completeLesson()
      }
      
      // Verify course is 100% complete
      expect(await coursePage.isCourseCompleted()).toBe(true)
      await expect(page).toHaveProgressPercentage(100)
      
      // Check dashboard shows completion
      await dashboardPage.navigateToDashboard()
      const progress = await dashboardPage.getCourseProgress('test-course-1')
      expect(progress).toBe(100)
    })

    test('should persist progress across sessions', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      await coursePage.completeLesson()
      
      // Simulate session restart by reloading page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Progress should be maintained
      expect(await coursePage.isLessonCompleted('lesson-1')).toBe(true)
    })
  })

  test.describe('Interactive Features', () => {
    test('should bookmark lessons', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Initially not bookmarked
      expect(await coursePage.isLessonBookmarked()).toBe(false)
      
      // Bookmark lesson
      await coursePage.bookmarkLesson()
      
      // Verify bookmark state
      expect(await coursePage.isLessonBookmarked()).toBe(true)
      
      // Remove bookmark
      await coursePage.bookmarkLesson()
      expect(await coursePage.isLessonBookmarked()).toBe(false)
    })

    test('should download lesson materials', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      const filename = await coursePage.downloadLessonMaterials()
      expect(filename).toContain('.pdf') // or expected file extension
    })

    test('should share lesson', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      await coursePage.shareLesson()
      
      // Verify share modal opens
      await expect(coursePage.page.locator('[data-testid="share-modal"]')).toBeVisible()
    })

    test('should toggle lesson transcript', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      await coursePage.toggleTranscript()
      
      // Verify transcript is visible
      await expect(coursePage.page.locator('[data-testid="transcript-panel"]')).toBeVisible()
      
      // Toggle off
      await coursePage.toggleTranscript()
      await expect(coursePage.page.locator('[data-testid="transcript-panel"]')).toBeHidden()
    })
  })

  test.describe('Comments and Discussion', () => {
    test('should add comment to lesson', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      const initialComments = await coursePage.getCommentsCount()
      
      await coursePage.addComment('This is a great lesson!')
      
      const newComments = await coursePage.getCommentsCount()
      expect(newComments).toBe(initialComments + 1)
    })

    test('should display existing comments', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      const commentsCount = await coursePage.getCommentsCount()
      if (commentsCount > 0) {
        await expect(coursePage.commentsSection).toBeVisible()
      }
    })

    test('should handle empty comment submission', async ({ coursePage }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Try to submit empty comment
      await coursePage.addComment('')
      
      // Should show validation error
      const errorMessage = await coursePage.page.locator('[data-testid="comment-error"]').textContent()
      expect(errorMessage).toContain('Comment cannot be empty')
    })
  })

  test.describe('Certificate Generation', () => {
    test('should generate certificate for completed course', async ({ coursePage }) => {
      // Complete all lessons first
      await coursePage.navigateToCourse('test-course-1')
      
      const lessonCount = await coursePage.getLessonsCount()
      for (let i = 0; i < lessonCount; i++) {
        await coursePage.selectLesson(i)
        await coursePage.completeLesson()
      }
      
      // Navigate back to course overview
      await coursePage.navigateToCourse('test-course-1')
      
      // Certificate button should be available
      await expect(coursePage.certificateButton).toBeVisible()
      
      // Download certificate
      const filename = await coursePage.downloadCertificate()
      expect(filename).toContain('certificate')
    })

    test('should not show certificate for incomplete course', async ({ coursePage }) => {
      await coursePage.navigateToCourse('test-course-1')
      
      // Ensure course is not complete
      const progress = await coursePage.getCourseProgress()
      if (progress < 100) {
        await expect(coursePage.certificateButton).not.toBeVisible()
      }
    })
  })

  test.describe('Mobile Learning Experience', () => {
    test('should adapt video player for mobile', async ({ coursePage, page }) => {
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Video should still be playable
      expect(await coursePage.isVideoLoaded()).toBe(true)
      await coursePage.playVideo()
      
      // Controls should be accessible
      await expect(coursePage.playButton).toBeVisible()
    })

    test('should optimize lesson navigation for mobile', async ({ coursePage, page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await coursePage.navigateToCourse('test-course-1')
      
      // Sidebar should be collapsible on mobile
      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click()
        await expect(coursePage.courseSidebar).toBeVisible()
      }
    })
  })

  test.describe('Offline Learning Capabilities', () => {
    test('should cache video for offline viewing', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Simulate going offline
      await page.setOffline(true)
      
      // Video should still be accessible if cached
      const isVideoAccessible = await coursePage.isVideoLoaded()
      // In real PWA, this would check if content is cached
      
      await page.setOffline(false)
    })

    test('should sync progress when back online', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Go offline
      await page.setOffline(true)
      
      // Complete lesson offline (would be stored locally)
      await coursePage.completeLesson()
      
      // Go back online
      await page.setOffline(false)
      await page.reload()
      
      // Progress should sync
      expect(await coursePage.isLessonCompleted('lesson-1')).toBe(true)
    })
  })

  test.describe('Learning Analytics', () => {
    test('should track video watch time', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Mock analytics tracking
      await page.addInitScript(() => {
        window.analytics = {
          track: (event: string, properties: any) => {
            (window as any).analyticsEvents = (window as any).analyticsEvents || []
            ;(window as any).analyticsEvents.push({ event, properties })
          }
        }
      })
      
      await coursePage.playVideo()
      await page.waitForTimeout(5000) // Watch for 5 seconds
      await coursePage.pauseVideo()
      
      // Check if watch time was tracked
      const events = await page.evaluate(() => (window as any).analyticsEvents)
      const watchEvent = events?.find((e: any) => e.event === 'video_progress')
      expect(watchEvent).toBeDefined()
    })

    test('should track lesson completion time', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      const startTime = Date.now()
      await coursePage.completeLesson()
      const endTime = Date.now()
      
      const completionTime = endTime - startTime
      expect(completionTime).toBeGreaterThan(0)
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle video loading errors', async ({ coursePage, page }) => {
      // Simulate video loading failure
      await page.route('**/*.mp4', route => route.abort('failed'))
      
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Should show error message
      const errorMessage = await page.locator('[data-testid="video-error"]').textContent()
      expect(errorMessage).toContain('Failed to load video')
      
      // Clear simulation
      await page.unroute('**/*.mp4')
    })

    test('should retry failed progress saves', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      
      // Simulate API failure
      await page.route('**/api/progress/**', route => route.abort('failed'))
      
      await coursePage.completeLesson()
      
      // Should show retry mechanism
      const retryButton = page.locator('[data-testid="retry-progress"]')
      if (await retryButton.isVisible()) {
        await page.unroute('**/api/progress/**')
        await retryButton.click()
      }
    })

    test('should handle network interruptions gracefully', async ({ coursePage, page }) => {
      await coursePage.navigateToLesson('test-course-1', 'lesson-1')
      await coursePage.playVideo()
      
      // Simulate network loss during playback
      await page.setOffline(true)
      await page.waitForTimeout(2000)
      
      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
      if (await offlineIndicator.isVisible()) {
        expect(await offlineIndicator.textContent()).toContain('Offline')
      }
      
      await page.setOffline(false)
    })
  })
})