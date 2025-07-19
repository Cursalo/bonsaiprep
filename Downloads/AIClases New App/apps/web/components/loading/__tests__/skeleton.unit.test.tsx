import { render, screen } from '@/test-utils/render'
import {
  Skeleton,
  CourseCardSkeleton,
  CourseGridSkeleton,
  LessonListSkeleton,
  UserProfileSkeleton,
  DashboardStatsSkeleton,
  ChatMessageSkeleton,
  ChatSkeleton,
  TableSkeleton,
  ProgressSkeleton,
  FormSkeleton,
  VideoPlayerSkeleton,
  ActivityFeedSkeleton,
  NavigationSkeleton,
  PageSkeleton,
} from '../skeleton'

// Mock the utils function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default classes', () => {
      render(<Skeleton data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse')
      expect(skeleton).toHaveClass('rounded-md')
    })

    it('applies custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-class')
    })

    it('passes through HTML attributes', () => {
      render(<Skeleton id="test-skeleton" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('id', 'test-skeleton')
    })

    it('applies aria-label for accessibility', () => {
      render(<Skeleton aria-label="Loading content" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
    })
  })

  describe('CourseCardSkeleton', () => {
    it('renders course card skeleton structure', () => {
      render(<CourseCardSkeleton />)
      
      // Should render the main container
      expect(screen.getByRole('generic')).toBeInTheDocument()
      
      // Should have glass-card styling
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('glass-card')
    })

    it('has proper accessibility structure', () => {
      const { container } = render(<CourseCardSkeleton />)
      
      // Should have multiple skeleton elements
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletonElements.length).toBeGreaterThan(5)
    })
  })

  describe('CourseGridSkeleton', () => {
    it('renders default number of course cards', () => {
      const { container } = render(<CourseGridSkeleton />)
      
      // Should render 6 course cards by default
      const cards = container.querySelectorAll('.glass-card')
      expect(cards).toHaveLength(6)
    })

    it('renders custom number of course cards', () => {
      const { container } = render(<CourseGridSkeleton count={3} />)
      
      const cards = container.querySelectorAll('.glass-card')
      expect(cards).toHaveLength(3)
    })

    it('has responsive grid classes', () => {
      const { container } = render(<CourseGridSkeleton />)
      
      const grid = container.firstChild
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })
  })

  describe('LessonListSkeleton', () => {
    it('renders default number of lessons', () => {
      const { container } = render(<LessonListSkeleton />)
      
      const lessons = container.querySelectorAll('.glass-card')
      expect(lessons).toHaveLength(5)
    })

    it('renders custom number of lessons', () => {
      const { container } = render(<LessonListSkeleton count={3} />)
      
      const lessons = container.querySelectorAll('.glass-card')
      expect(lessons).toHaveLength(3)
    })

    it('has proper lesson item structure', () => {
      const { container } = render(<LessonListSkeleton count={1} />)
      
      const lessonItem = container.querySelector('.glass-card')
      expect(lessonItem).toHaveClass('flex')
      expect(lessonItem).toHaveClass('items-center')
    })
  })

  describe('UserProfileSkeleton', () => {
    it('renders user profile skeleton structure', () => {
      const { container } = render(<UserProfileSkeleton />)
      
      expect(container.querySelector('.glass-card')).toBeInTheDocument()
    })

    it('renders stats grid', () => {
      const { container } = render(<UserProfileSkeleton />)
      
      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')
      expect(statsGrid).toBeInTheDocument()
    })

    it('has accessibility considerations', () => {
      const { container } = render(<UserProfileSkeleton />)
      
      // Should have multiple skeleton elements for screen readers
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletonElements.length).toBeGreaterThan(10)
    })
  })

  describe('DashboardStatsSkeleton', () => {
    it('renders 4 stat cards', () => {
      const { container } = render(<DashboardStatsSkeleton />)
      
      const statCards = container.querySelectorAll('.glass-card')
      expect(statCards).toHaveLength(4)
    })

    it('has responsive grid layout', () => {
      const { container } = render(<DashboardStatsSkeleton />)
      
      const grid = container.firstChild
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('ChatMessageSkeleton', () => {
    it('renders user message alignment', () => {
      const { container } = render(<ChatMessageSkeleton isUser={true} />)
      
      const messageContainer = container.firstChild
      expect(messageContainer).toHaveClass('justify-end')
    })

    it('renders AI message alignment', () => {
      const { container } = render(<ChatMessageSkeleton isUser={false} />)
      
      const messageContainer = container.firstChild
      expect(messageContainer).toHaveClass('justify-start')
    })

    it('shows avatar for AI messages only', () => {
      const { container: userContainer } = render(<ChatMessageSkeleton isUser={true} />)
      const { container: aiContainer } = render(<ChatMessageSkeleton isUser={false} />)
      
      // AI message should have avatar at the beginning
      const aiAvatars = aiContainer.querySelectorAll('.rounded-full')
      expect(aiAvatars.length).toBeGreaterThan(0)
      
      // User message should have avatar at the end
      const userAvatars = userContainer.querySelectorAll('.rounded-full')
      expect(userAvatars.length).toBeGreaterThan(0)
    })
  })

  describe('ChatSkeleton', () => {
    it('renders chat interface structure', () => {
      const { container } = render(<ChatSkeleton />)
      
      // Should have messages area and input area
      expect(container.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument()
      expect(container.querySelector('.border-t')).toBeInTheDocument()
    })

    it('renders multiple message skeletons', () => {
      const { container } = render(<ChatSkeleton />)
      
      // Should render both user and AI message skeletons
      const messageContainers = container.querySelectorAll('.flex.gap-3')
      expect(messageContainers.length).toBeGreaterThan(2)
    })
  })

  describe('TableSkeleton', () => {
    it('renders with default dimensions', () => {
      const { container } = render(<TableSkeleton />)
      
      // Should render header + 5 rows by default
      const rows = container.querySelectorAll('.flex.space-x-4')
      expect(rows).toHaveLength(6) // 1 header + 5 rows
    })

    it('renders with custom dimensions', () => {
      const { container } = render(<TableSkeleton rows={3} columns={2} />)
      
      const rows = container.querySelectorAll('.flex.space-x-4')
      expect(rows).toHaveLength(4) // 1 header + 3 rows
      
      // Check first row has correct number of columns
      const firstRowColumns = rows[0].children
      expect(firstRowColumns).toHaveLength(2)
    })

    it('distinguishes header from data rows', () => {
      const { container } = render(<TableSkeleton />)
      
      // Header should have different styling
      const header = container.querySelector('.bg-muted\\/20')
      expect(header).toBeInTheDocument()
    })
  })

  describe('ProgressSkeleton', () => {
    it('renders progress bar structure', () => {
      const { container } = render(<ProgressSkeleton />)
      
      // Should have label and value on top, progress bar below
      const progressElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(progressElements.length).toBe(3) // label, value, progress bar
    })

    it('has proper progress bar styling', () => {
      const { container } = render(<ProgressSkeleton />)
      
      const progressBar = container.querySelector('.h-2.w-full.rounded-full')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('FormSkeleton', () => {
    it('renders form fields structure', () => {
      const { container } = render(<FormSkeleton />)
      
      // Should have multiple form fields
      const formFields = container.querySelectorAll('.space-y-2')
      expect(formFields.length).toBeGreaterThan(3)
    })

    it('renders action buttons', () => {
      const { container } = render(<FormSkeleton />)
      
      // Should have buttons at the bottom
      const buttonContainer = container.querySelector('.flex.justify-end.space-x-2')
      expect(buttonContainer).toBeInTheDocument()
      
      const buttons = buttonContainer?.children
      expect(buttons).toHaveLength(2)
    })

    it('has responsive grid for form fields', () => {
      const { container } = render(<FormSkeleton />)
      
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('VideoPlayerSkeleton', () => {
    it('renders video player structure', () => {
      const { container } = render(<VideoPlayerSkeleton />)
      
      // Should have video area with proper aspect ratio
      const videoArea = container.querySelector('.aspect-video')
      expect(videoArea).toBeInTheDocument()
    })

    it('renders video metadata', () => {
      const { container } = render(<VideoPlayerSkeleton />)
      
      // Should have title, description, and creator info
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletonElements.length).toBeGreaterThan(5)
    })
  })

  describe('ActivityFeedSkeleton', () => {
    it('renders default number of activities', () => {
      const { container } = render(<ActivityFeedSkeleton />)
      
      const activities = container.querySelectorAll('.flex.items-start.space-x-3')
      expect(activities).toHaveLength(5)
    })

    it('renders custom number of activities', () => {
      const { container } = render(<ActivityFeedSkeleton count={3} />)
      
      const activities = container.querySelectorAll('.flex.items-start.space-x-3')
      expect(activities).toHaveLength(3)
    })

    it('each activity has avatar and content', () => {
      const { container } = render(<ActivityFeedSkeleton count={1} />)
      
      const activity = container.querySelector('.flex.items-start.space-x-3')
      const avatar = activity?.querySelector('.rounded-full')
      expect(avatar).toBeInTheDocument()
      
      const content = activity?.querySelector('.flex-1')
      expect(content).toBeInTheDocument()
    })
  })

  describe('NavigationSkeleton', () => {
    it('renders navigation items', () => {
      const { container } = render(<NavigationSkeleton />)
      
      const navItems = container.querySelectorAll('.flex.items-center.space-x-3')
      expect(navItems).toHaveLength(5)
    })

    it('each nav item has icon and label', () => {
      const { container } = render(<NavigationSkeleton />)
      
      const firstNavItem = container.querySelector('.flex.items-center.space-x-3')
      const skeletonElements = firstNavItem?.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletonElements).toHaveLength(2) // icon + label
    })
  })

  describe('PageSkeleton', () => {
    it('renders complete page structure', () => {
      const { container } = render(<PageSkeleton />)
      
      // Should have container with proper spacing
      const pageContainer = container.querySelector('.container.mx-auto')
      expect(pageContainer).toBeInTheDocument()
    })

    it('includes various page sections', () => {
      const { container } = render(<PageSkeleton />)
      
      // Should include stats, main content, and sidebar
      const statsSection = container.querySelector('.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(statsSection).toBeInTheDocument()
      
      const mainGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3')
      expect(mainGrid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('all skeletons are accessible to screen readers', () => {
      const { container } = render(
        <div>
          <Skeleton aria-label="Loading content" />
          <CourseCardSkeleton />
          <UserProfileSkeleton />
        </div>
      )
      
      // Skeleton elements should not interfere with screen readers
      const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('provides appropriate loading states', () => {
      const { container } = render(<ChatSkeleton />)
      
      // Should indicate loading state for assistive technologies
      expect(container.firstChild).toHaveClass('flex')
      expect(container.firstChild).toHaveClass('flex-col')
    })
  })

  describe('Performance', () => {
    it('renders large grids efficiently', () => {
      const startTime = performance.now()
      render(<CourseGridSkeleton count={20} />)
      const endTime = performance.now()
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('renders complex skeletons efficiently', () => {
      const startTime = performance.now()
      render(<PageSkeleton />)
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})