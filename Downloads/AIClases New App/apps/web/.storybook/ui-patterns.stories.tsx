import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from '../app/components/loading/skeleton'

const meta: Meta = {
  title: 'Patterns/UI Layouts',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Common UI patterns and layouts used throughout the AIClases application.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock components for demonstration
const CourseCard = ({ title, instructor, price, isEnrolled = false }: any) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
      Course Thumbnail
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-2">by {instructor}</p>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-green-600">${price}</span>
        <button 
          className={`px-4 py-2 rounded ${
            isEnrolled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEnrolled ? 'Continue' : 'Enroll'}
        </button>
      </div>
    </div>
  </div>
)

const ProgressCard = ({ course, progress }: any) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h3 className="font-semibold mb-2">{course}</h3>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
      <div 
        className="bg-blue-600 h-2 rounded-full" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <p className="text-sm text-gray-600">{progress}% complete</p>
  </div>
)

export const CourseCatalog: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Course Catalog</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Categories</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>React</option>
            </select>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Filter
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CourseCard title="JavaScript Fundamentals" instructor="John Doe" price="49" />
          <CourseCard title="React for Beginners" instructor="Jane Smith" price="79" />
          <CourseCard title="Python Basics" instructor="Bob Johnson" price="59" />
          <CourseCard title="Node.js Advanced" instructor="Alice Brown" price="89" isEnrolled />
          <CourseCard title="Database Design" instructor="Mike Wilson" price="69" />
          <CourseCard title="API Development" instructor="Sarah Davis" price="99" />
        </div>
      </div>
    </div>
  ),
}

export const StudentDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Student!</h1>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressCard course="JavaScript Fundamentals" progress={75} />
                <ProgressCard course="React for Beginners" progress={45} />
                <ProgressCard course="Node.js Advanced" progress={20} />
                <ProgressCard course="Database Design" progress={90} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CourseCard title="Advanced JavaScript" instructor="Expert Teacher" price="129" />
                <CourseCard title="React Native Basics" instructor="Mobile Expert" price="99" />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Your Credits</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">150</div>
                <p className="text-gray-600 mb-4">Available Credits</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Buy More Credits
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Completed "Variables in JS"</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Started "Functions Basics"</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Asked mentor about arrays</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const AdminDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold">AIClases Admin</h2>
          </div>
          <nav className="mt-8">
            <div className="px-4 py-2 bg-blue-600">Dashboard</div>
            <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Users</div>
            <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Courses</div>
            <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Payments</div>
            <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Analytics</div>
            <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Settings</div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">1,234</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Active Courses</h3>
              <p className="text-3xl font-bold text-green-600">56</p>
              <p className="text-sm text-green-600">+3 new this week</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">$45,678</p>
              <p className="text-sm text-green-600">+8% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Support Tickets</h3>
              <p className="text-3xl font-bold text-red-600">23</p>
              <p className="text-sm text-red-600">5 urgent</p>
            </div>
          </div>
          
          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Recent Users</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {['John Doe', 'Jane Smith', 'Bob Johnson'].map(name => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span>{name}</span>
                      </div>
                      <span className="text-sm text-gray-600">2 hours ago</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Popular Courses</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'JavaScript Fundamentals', enrollments: 234 },
                    { name: 'React for Beginners', enrollments: 189 },
                    { name: 'Python Basics', enrollments: 156 }
                  ].map(course => (
                    <div key={course.name} className="flex justify-between">
                      <span>{course.name}</span>
                      <span className="text-sm text-gray-600">{course.enrollments} enrollments</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">Loading States</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Course Cards Loading</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <Skeleton className="h-32 w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Dashboard Loading</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const ErrorStates: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">Error States</h1>
      
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We encountered an error while loading your courses.</p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h2>
            <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Browse Courses
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-yellow-500 text-6xl mb-4">🔌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">Please check your internet connection and try again.</p>
            <div className="space-x-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Retry
              </button>
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Go Offline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}