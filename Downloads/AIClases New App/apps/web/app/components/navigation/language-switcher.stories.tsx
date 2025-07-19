import type { Meta, StoryObj } from '@storybook/react'
import { LanguageSwitcher } from './language-switcher'

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Components/Navigation/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A language switcher component that allows users to change the application language between English, Spanish, and Portuguese.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-blue-600">AIClases</h1>
        <nav className="hidden md:flex space-x-4">
          <a href="#" className="text-gray-600 hover:text-gray-900">Courses</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">Dashboard</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Sign In
        </button>
      </div>
    </div>
  ),
}

export const InSidebar: Story = {
  render: () => (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">AIClases</h2>
        <nav className="space-y-2">
          <a href="#" className="block px-3 py-2 rounded-md bg-gray-800">Dashboard</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Courses</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Mentor</a>
          <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Profile</a>
        </nav>
      </div>
      <div className="border-t border-gray-700 pt-4">
        <div className="mb-2 text-sm text-gray-400">Language</div>
        <LanguageSwitcher />
      </div>
    </div>
  ),
}

export const InFooter: Story = {
  render: () => (
    <footer className="bg-gray-100 border-t p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-semibold mb-4">AIClases</h3>
          <p className="text-sm text-gray-600">
            Learn programming with AI-powered personalized education.
          </p>
        </div>
        <div>
          <h4 className="font-medium mb-4">Courses</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="#" className="hover:text-gray-900">JavaScript</a></li>
            <li><a href="#" className="hover:text-gray-900">Python</a></li>
            <li><a href="#" className="hover:text-gray-900">React</a></li>
            <li><a href="#" className="hover:text-gray-900">Node.js</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="#" className="hover:text-gray-900">Help Center</a></li>
            <li><a href="#" className="hover:text-gray-900">Contact</a></li>
            <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
            <li><a href="#" className="hover:text-gray-900">Terms</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-4">Language</h4>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  ),
}

export const Compact: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Language:</span>
      <LanguageSwitcher />
    </div>
  ),
}