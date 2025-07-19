import { Page, Locator } from '@playwright/test'

export class CoursePage {
  readonly page: Page
  readonly courseTitle: Locator
  readonly courseDescription: Locator
  readonly courseInstructor: Locator
  readonly courseDuration: Locator
  readonly courseRating: Locator
  readonly enrollButton: Locator
  readonly startCourseButton: Locator
  readonly continueButton: Locator
  readonly progressBar: Locator
  readonly lessonsList: Locator
  readonly currentLesson: Locator
  readonly videoPlayer: Locator
  readonly playButton: Locator
  readonly pauseButton: Locator
  readonly nextLessonButton: Locator
  readonly previousLessonButton: Locator
  readonly lessonNotes: Locator
  readonly downloadButton: Locator
  readonly shareButton: Locator
  readonly bookmarkButton: Locator
  readonly completeLessonButton: Locator
  readonly transcriptButton: Locator
  readonly speedControl: Locator
  readonly qualityControl: Locator
  readonly fullscreenButton: Locator
  readonly commentsSection: Locator
  readonly addCommentButton: Locator
  readonly commentInput: Locator
  readonly courseSidebar: Locator
  readonly certificateButton: Locator

  constructor(page: Page) {
    this.page = page
    this.courseTitle = page.locator('[data-testid="course-title"]')
    this.courseDescription = page.locator('[data-testid="course-description"]')
    this.courseInstructor = page.locator('[data-testid="course-instructor"]')
    this.courseDuration = page.locator('[data-testid="course-duration"]')
    this.courseRating = page.locator('[data-testid="course-rating"]')
    this.enrollButton = page.locator('[data-testid="enroll-button"]')
    this.startCourseButton = page.locator('[data-testid="start-course-button"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
    this.progressBar = page.locator('[data-testid="course-progress"]')
    this.lessonsList = page.locator('[data-testid="lessons-list"]')
    this.currentLesson = page.locator('[data-testid="current-lesson"]')
    this.videoPlayer = page.locator('[data-testid="video-player"]')
    this.playButton = page.locator('[data-testid="play-button"]')
    this.pauseButton = page.locator('[data-testid="pause-button"]')
    this.nextLessonButton = page.locator('[data-testid="next-lesson-button"]')
    this.previousLessonButton = page.locator('[data-testid="previous-lesson-button"]')
    this.lessonNotes = page.locator('[data-testid="lesson-notes"]')
    this.downloadButton = page.locator('[data-testid="download-button"]')
    this.shareButton = page.locator('[data-testid="share-button"]')
    this.bookmarkButton = page.locator('[data-testid="bookmark-button"]')
    this.completeLessonButton = page.locator('[data-testid="complete-lesson-button"]')
    this.transcriptButton = page.locator('[data-testid="transcript-button"]')
    this.speedControl = page.locator('[data-testid="speed-control"]')
    this.qualityControl = page.locator('[data-testid="quality-control"]')
    this.fullscreenButton = page.locator('[data-testid="fullscreen-button"]')
    this.commentsSection = page.locator('[data-testid="comments-section"]')
    this.addCommentButton = page.locator('[data-testid="add-comment-button"]')
    this.commentInput = page.locator('[data-testid="comment-input"]')
    this.courseSidebar = page.locator('[data-testid="course-sidebar"]')
    this.certificateButton = page.locator('[data-testid="certificate-button"]')
  }

  async navigateToCourse(courseId: string) {
    await this.page.goto(`/courses/${courseId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToLesson(courseId: string, lessonId: string) {
    await this.page.goto(`/courses/${courseId}/lessons/${lessonId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async getCourseTitle() {
    return await this.courseTitle.textContent()
  }

  async getCourseDescription() {
    return await this.courseDescription.textContent()
  }

  async getCourseInstructor() {
    return await this.courseInstructor.textContent()
  }

  async getCourseDuration() {
    const durationText = await this.courseDuration.textContent()
    return durationText
  }

  async getCourseRating() {
    const ratingText = await this.courseRating.textContent()
    return parseFloat(ratingText?.replace(/[^\d.]/g, '') || '0')
  }

  async enrollInCourse() {
    await this.enrollButton.click()
    // Wait for enrollment to complete
    await this.page.waitForSelector('[data-testid="enrollment-success"]', { timeout: 10000 })
  }

  async startCourse() {
    await this.startCourseButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async continueCourse() {
    await this.continueButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getCourseProgress() {
    const progressValue = await this.progressBar.getAttribute('aria-valuenow')
    return parseInt(progressValue || '0')
  }

  async getLessonsCount() {
    const lessons = await this.lessonsList.locator('.lesson-item').count()
    return lessons
  }

  async selectLesson(lessonIndex: number) {
    const lesson = this.lessonsList.locator('.lesson-item').nth(lessonIndex)
    await lesson.click()
    await this.page.waitForLoadState('networkidle')
  }

  async selectLessonByTitle(lessonTitle: string) {
    const lesson = this.lessonsList.locator('.lesson-item', { hasText: lessonTitle })
    await lesson.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getCurrentLessonTitle() {
    return await this.currentLesson.textContent()
  }

  async playVideo() {
    await this.playButton.click()
    await this.page.waitForTimeout(1000) // Wait for video to start
  }

  async pauseVideo() {
    await this.pauseButton.click()
    await this.page.waitForTimeout(500)
  }

  async goToNextLesson() {
    await this.nextLessonButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goToPreviousLesson() {
    await this.previousLessonButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeLesson() {
    await this.completeLessonButton.click()
    await this.page.waitForSelector('[data-testid="lesson-completed"]', { timeout: 5000 })
  }

  async downloadLessonMaterials() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.downloadButton.click()
    const download = await downloadPromise
    return download.suggestedFilename()
  }

  async shareLesson() {
    await this.shareButton.click()
    await this.page.waitForSelector('[data-testid="share-modal"]')
  }

  async bookmarkLesson() {
    await this.bookmarkButton.click()
    // Wait for bookmark state to update
    await this.page.waitForTimeout(500)
  }

  async isLessonBookmarked() {
    const bookmarkIcon = this.bookmarkButton.locator('.bookmarked')
    return await bookmarkIcon.isVisible()
  }

  async toggleTranscript() {
    await this.transcriptButton.click()
    await this.page.waitForTimeout(500)
  }

  async changePlaybackSpeed(speed: '0.5' | '0.75' | '1' | '1.25' | '1.5' | '2') {
    await this.speedControl.click()
    await this.page.locator(`[data-speed="${speed}"]`).click()
  }

  async changeVideoQuality(quality: '360p' | '480p' | '720p' | '1080p') {
    await this.qualityControl.click()
    await this.page.locator(`[data-quality="${quality}"]`).click()
  }

  async enterFullscreen() {
    await this.fullscreenButton.click()
    await this.page.waitForTimeout(1000)
  }

  async addComment(comment: string) {
    await this.addCommentButton.click()
    await this.commentInput.fill(comment)
    await this.page.keyboard.press('Enter')
    await this.page.waitForTimeout(1000)
  }

  async getCommentsCount() {
    const comments = await this.commentsSection.locator('.comment-item').count()
    return comments
  }

  async downloadCertificate() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.certificateButton.click()
    const download = await downloadPromise
    return download.suggestedFilename()
  }

  async isVideoLoaded() {
    return await this.videoPlayer.isVisible()
  }

  async getVideoCurrentTime() {
    const currentTime = await this.videoPlayer.evaluate((video: HTMLVideoElement) => video.currentTime)
    return currentTime
  }

  async getVideoDuration() {
    const duration = await this.videoPlayer.evaluate((video: HTMLVideoElement) => video.duration)
    return duration
  }

  async isLessonCompleted(lessonTitle: string) {
    const lesson = this.lessonsList.locator('.lesson-item', { hasText: lessonTitle })
    const completedIcon = lesson.locator('.completed-icon')
    return await completedIcon.isVisible()
  }

  async getCompletedLessonsCount() {
    const completedLessons = await this.lessonsList.locator('.lesson-item .completed-icon').count()
    return completedLessons
  }

  async isCourseCompleted() {
    const progress = await this.getCourseProgress()
    return progress === 100
  }
}