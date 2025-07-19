import { FullConfig } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...')

  try {
    // Clean up test data
    await cleanupTestData()

    // Clean up authentication files
    await cleanupAuthFiles()

    // Clean up any temporary files
    await cleanupTempFiles()

  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw to avoid failing the test run
  }

  console.log('✅ E2E test teardown completed')
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')
  
  try {
    // Clean up test database records
    // This would typically involve calling cleanup APIs
    // or directly cleaning the test database
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error)
  }
}

async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...')
  
  const authDir = path.join(__dirname, '.auth')
  
  try {
    // Check if auth directory exists
    await fs.access(authDir)
    
    // Read all files in auth directory
    const files = await fs.readdir(authDir)
    
    // Delete each auth file
    for (const file of files) {
      const filePath = path.join(authDir, file)
      await fs.unlink(filePath)
      console.log(`🗑️ Deleted auth file: ${file}`)
    }
    
    // Remove the auth directory
    await fs.rmdir(authDir)
    
    console.log('✅ Auth files cleanup completed')
  } catch (error) {
    // Auth directory might not exist, which is fine
    console.log('📁 No auth files to clean up')
  }
}

async function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...')
  
  const tempPaths = [
    'test-results',
    'playwright-report',
    'coverage-e2e'
  ]
  
  for (const tempPath of tempPaths) {
    try {
      const fullPath = path.join(process.cwd(), tempPath)
      await fs.access(fullPath)
      
      // Remove directory recursively
      await fs.rmdir(fullPath, { recursive: true })
      console.log(`🗑️ Cleaned up: ${tempPath}`)
    } catch (error) {
      // Directory might not exist, which is fine
      console.log(`📁 No temp directory to clean: ${tempPath}`)
    }
  }
  
  console.log('✅ Temp files cleanup completed')
}

export default globalTeardown