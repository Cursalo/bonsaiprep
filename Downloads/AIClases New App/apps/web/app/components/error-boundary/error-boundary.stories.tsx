import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary } from './error-boundary'
import { useState } from 'react'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An error boundary component that catches JavaScript errors in child components and displays a fallback UI.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Component that throws an error for testing
const ErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a test error for the error boundary!')
  }
  return <div className="p-4 bg-green-100 text-green-800 rounded">✅ Component working correctly</div>
}

// Component with controlled error
const ControlledErrorComponent = () => {
  const [hasError, setHasError] = useState(false)
  
  return (
    <div className="space-y-4">
      <button
        onClick={() => setHasError(!hasError)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {hasError ? 'Fix Component' : 'Break Component'}
      </button>
      <ErrorComponent shouldThrow={hasError} />
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 bg-blue-100 text-blue-800 rounded">
        This component is working fine and won't trigger the error boundary.
      </div>
    </ErrorBoundary>
  ),
}

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
}

export const Interactive: Story = {
  render: () => (
    <ErrorBoundary>
      <ControlledErrorComponent />
    </ErrorBoundary>
  ),
}

export const NestedComponents: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Course Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-medium mb-2">Your Courses</h4>
            <ErrorComponent shouldThrow={false} />
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-medium mb-2">Progress Analytics</h4>
            <ErrorComponent shouldThrow={true} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  ),
}

export const InCourseCard: Story = {
  render: () => (
    <div className="max-w-md">
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <img 
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop" 
          alt="Course" 
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">JavaScript Fundamentals</h3>
          <p className="text-gray-600 mb-4">Learn the basics of JavaScript programming</p>
          <ErrorBoundary>
            <ErrorComponent shouldThrow={true} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  ),
}

export const InAdminPanel: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">1,234</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Active Courses</h3>
              <p className="text-2xl font-bold text-green-600">56</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Error Reports</h3>
              <ErrorBoundary>
                <ErrorComponent shouldThrow={true} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const MultipleErrorBoundaries: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Section 1 - Working Component</h3>
        <ErrorBoundary>
          <ErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Section 2 - Broken Component</h3>
        <ErrorBoundary>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Section 3 - Another Working Component</h3>
        <ErrorBoundary>
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            ⚡ This section continues to work even when other sections fail
          </div>
        </ErrorBoundary>
      </div>
    </div>
  ),
}