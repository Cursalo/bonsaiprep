import { extractCodeExamples, processFrameworkUpdate } from '../extract-code-examples'

describe('extractCodeExamples', () => {
  describe('Basic functionality', () => {
    it('extracts TypeScript code blocks', () => {
      const content = `
Here's some content.

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

function createUser(data: Partial<User>): User {
  return {
    id: generateId(),
    ...data
  } as User
}
\`\`\`

More content here.
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('interface User')
      expect(examples[0]).toContain('function createUser')
    })

    it('extracts JavaScript code blocks', () => {
      const content = `
\`\`\`javascript
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]

function findUser(id) {
  return users.find(user => user.id === id)
}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('const users')
      expect(examples[0]).toContain('function findUser')
    })

    it('extracts TSX code blocks', () => {
      const content = `
\`\`\`tsx
import React from 'react'

interface Props {
  title: string
  children: React.ReactNode
}

export function Card({ title, children }: Props) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('import React')
      expect(examples[0]).toContain('export function Card')
    })

    it('extracts JSX code blocks', () => {
      const content = `
\`\`\`jsx
function Welcome({ name }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Welcome to our application.</p>
    </div>
  )
}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('function Welcome')
      expect(examples[0]).toContain('<h1>Hello, {name}!</h1>')
    })

    it('supports ts and js extensions', () => {
      const content = `
\`\`\`ts
type Status = 'pending' | 'completed' | 'failed'
\`\`\`

\`\`\`js
const config = { apiUrl: 'https://api.example.com' }
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(2)
      expect(examples[0]).toContain('type Status')
      expect(examples[1]).toContain('const config')
    })
  })

  describe('Multiple code blocks', () => {
    it('extracts multiple code blocks from the same content', () => {
      const content = `
First example:

\`\`\`typescript
interface APIResponse<T> {
  data: T
  status: number
  message?: string
}
\`\`\`

Second example:

\`\`\`javascript
async function fetchUsers() {
  const response = await fetch('/api/users')
  const data = await response.json()
  return data
}
\`\`\`

Third example:

\`\`\`tsx
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(3)
      expect(examples[0]).toContain('interface APIResponse')
      expect(examples[1]).toContain('async function fetchUsers')
      expect(examples[2]).toContain('function UserList')
    })

    it('maintains order of code blocks', () => {
      const content = `
\`\`\`typescript
const first = 'This is the first code block'
\`\`\`

\`\`\`javascript
const second = 'This is the second code block'
\`\`\`

\`\`\`tsx
const third = 'This is the third code block'
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples[0]).toContain('first code block')
      expect(examples[1]).toContain('second code block')
      expect(examples[2]).toContain('third code block')
    })
  })

  describe('Filtering criteria', () => {
    it('filters out code blocks shorter than 50 characters', () => {
      const content = `
\`\`\`typescript
const x = 1
\`\`\`

\`\`\`javascript
const longerCodeExample = {
  prop1: 'value1',
  prop2: 'value2',
  method: function() {
    return 'This is long enough'
  }
}
\`\`\`

\`\`\`tsx
<div>short</div>
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('longerCodeExample')
    })

    it('includes code blocks that are exactly 50 characters', () => {
      // Create a code block that's exactly 50 characters
      const fiftyCharCode = 'const test = "1234567890123456789012345678901234"'
      expect(fiftyCharCode.length).toBe(50)

      const content = `
\`\`\`typescript
${fiftyCharCode}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(0) // Should be excluded as it's not > 50
    })

    it('includes code blocks longer than 50 characters', () => {
      const longCode = 'const test = "12345678901234567890123456789012345"' // 51 chars
      expect(longCode.length).toBe(51)

      const content = `
\`\`\`typescript
${longCode}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toBe(longCode)
    })

    it('trims whitespace from extracted code', () => {
      const content = `
\`\`\`typescript

  const example = {
    property: 'value with proper spacing and length'
  }

\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).not.toStartWith(' ')
      expect(examples[0]).not.toEndWith(' ')
      expect(examples[0]).not.toStartWith('\n')
      expect(examples[0]).not.toEndWith('\n')
    })
  })

  describe('Edge cases', () => {
    it('returns empty array for content with no code blocks', () => {
      const content = `
This is just regular text content.
No code blocks here.
      `

      const examples = extractCodeExamples(content)
      expect(examples).toEqual([])
    })

    it('ignores code blocks with unsupported languages', () => {
      const content = `
\`\`\`python
def hello():
    print("This should be ignored as it's Python")
\`\`\`

\`\`\`sql
SELECT * FROM users WHERE active = true;
\`\`\`

\`\`\`typescript
const supportedExample = 'This should be included and is long enough'
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('supportedExample')
    })

    it('handles code blocks without language specification', () => {
      const content = `
\`\`\`
const unspecifiedLanguage = 'This has no language specified'
\`\`\`

\`\`\`typescript
const specifiedLanguage = 'This has TypeScript specified and is long enough'
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('specifiedLanguage')
    })

    it('handles empty code blocks', () => {
      const content = `
\`\`\`typescript
\`\`\`

\`\`\`javascript
const validExample = 'This is a valid example with sufficient length'
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('validExample')
    })

    it('handles malformed code blocks', () => {
      const content = `
\`\`typescript
const missingClosing = 'This is missing closing backticks'

\`\`\`javascript
const validExample = 'This is properly formatted and long enough'
\`\`\`

\`\`\`tsx
const anotherValid = 'Another properly formatted example'
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('validExample')
    })

    it('handles nested backticks within code blocks', () => {
      const content = `
\`\`\`typescript
const example = \`Template literal with \${variable} interpolation\`
const codeString = 'const nested = \`nested template\`'
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(1)
      expect(examples[0]).toContain('Template literal')
      expect(examples[0]).toContain('nested template')
    })

    it('handles empty string input', () => {
      const examples = extractCodeExamples('')
      expect(examples).toEqual([])
    })

    it('handles null or undefined input gracefully', () => {
      expect(() => extractCodeExamples(null as any)).toThrow()
      expect(() => extractCodeExamples(undefined as any)).toThrow()
    })
  })

  describe('Complex content', () => {
    it('extracts from realistic documentation content', () => {
      const content = `
# API Documentation

## User Management

Here's how to create a user:

\`\`\`typescript
interface CreateUserRequest {
  name: string
  email: string
  role: 'user' | 'admin'
}

async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create user')
  }
  
  return response.json()
}
\`\`\`

And here's how to use it in a React component:

\`\`\`tsx
import { useState } from 'react'
import { createUser, type CreateUserRequest } from './api'

export function UserForm() {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    role: 'user'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await createUser(formData)
      console.log('User created:', user)
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <select
        value={formData.role}
        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Create User</button>
    </form>
  )
}
\`\`\`

## Error Handling

For better error handling, use this utility:

\`\`\`javascript
class APIError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
    this.name = 'APIError'
  }
}

async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    
    if (!response.ok) {
      throw new APIError(
        'Request failed',
        response.status,
        await response.text()
      )
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('Network error', 0, error.message)
  }
}
\`\`\`
      `

      const examples = extractCodeExamples(content)
      expect(examples).toHaveLength(3)
      expect(examples[0]).toContain('interface CreateUserRequest')
      expect(examples[1]).toContain('export function UserForm')
      expect(examples[2]).toContain('class APIError')
    })
  })
})

describe('processFrameworkUpdate', () => {
  beforeEach(() => {
    // Mock Date to get consistent timestamps
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Basic functionality', () => {
    it('processes documentation with code examples', () => {
      const docs = {
        content: `
# Framework Update

New features include:

\`\`\`typescript
interface NewFeature {
  id: string
  name: string
  enabled: boolean
}

function enableFeature(featureId: string): void {
  // Implementation here
}
\`\`\`

\`\`\`tsx
function FeatureToggle({ feature }: { feature: NewFeature }) {
  return (
    <button disabled={!feature.enabled}>
      {feature.name}
    </button>
  )
}
\`\`\`
        `
      }

      const result = processFrameworkUpdate('react-v18', docs)

      expect(result.libraryId).toBe('react-v18')
      expect(result.hasChanges).toBe(true)
      expect(result.examples).toHaveLength(2)
      expect(result.examples[0]).toContain('interface NewFeature')
      expect(result.examples[1]).toContain('function FeatureToggle')
      expect(result.lastUpdated).toBe('2024-01-01T12:00:00.000Z')
    })

    it('processes documentation without code examples', () => {
      const docs = {
        content: `
# Framework Update

This is a text-only update with no code examples.
Just documentation improvements and clarifications.
        `
      }

      const result = processFrameworkUpdate('vue-v3', docs)

      expect(result.libraryId).toBe('vue-v3')
      expect(result.hasChanges).toBe(false)
      expect(result.examples).toEqual([])
      expect(result.lastUpdated).toBe('2024-01-01T12:00:00.000Z')
    })

    it('limits examples to first 3', () => {
      const docs = {
        content: `
\`\`\`typescript
const example1 = 'First example with enough characters to pass the filter'
\`\`\`

\`\`\`javascript
const example2 = 'Second example with enough characters to pass the filter'
\`\`\`

\`\`\`tsx
const example3 = 'Third example with enough characters to pass the filter'
\`\`\`

\`\`\`jsx
const example4 = 'Fourth example with enough characters to pass the filter'
\`\`\`

\`\`\`ts
const example5 = 'Fifth example with enough characters to pass the filter'
\`\`\`
        `
      }

      const result = processFrameworkUpdate('library-id', docs)

      expect(result.examples).toHaveLength(3)
      expect(result.examples[0]).toContain('example1')
      expect(result.examples[1]).toContain('example2')
      expect(result.examples[2]).toContain('example3')
      expect(result.examples.some(ex => ex.includes('example4'))).toBe(false)
      expect(result.examples.some(ex => ex.includes('example5'))).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('handles docs without content property', () => {
      const docs = {}

      expect(() => processFrameworkUpdate('test-lib', docs)).toThrow()
    })

    it('handles docs with null content', () => {
      const docs = { content: null }

      expect(() => processFrameworkUpdate('test-lib', docs)).toThrow()
    })

    it('handles docs with empty content', () => {
      const docs = { content: '' }

      const result = processFrameworkUpdate('empty-lib', docs)

      expect(result.libraryId).toBe('empty-lib')
      expect(result.hasChanges).toBe(false)
      expect(result.examples).toEqual([])
    })

    it('handles docs with only short code examples', () => {
      const docs = {
        content: `
\`\`\`typescript
const x = 1
\`\`\`

\`\`\`javascript
let y = 2
\`\`\`
        `
      }

      const result = processFrameworkUpdate('short-examples', docs)

      expect(result.hasChanges).toBe(false)
      expect(result.examples).toEqual([])
    })

    it('correctly identifies changes when there are valid examples', () => {
      const docs = {
        content: `
Some text content.

\`\`\`typescript
const validExample = 'This is long enough to be included in the results'
\`\`\`

More text.
        `
      }

      const result = processFrameworkUpdate('has-changes', docs)

      expect(result.hasChanges).toBe(true)
      expect(result.examples).toHaveLength(1)
    })
  })

  describe('Integration with extractCodeExamples', () => {
    it('uses the same filtering logic as extractCodeExamples', () => {
      const content = `
\`\`\`typescript
const shortExample = 'short'
\`\`\`

\`\`\`javascript
const longExample = 'This is a long example that should be included in results'
\`\`\`
      `

      const directExtraction = extractCodeExamples(content)
      const processedResult = processFrameworkUpdate('test', { content })

      expect(processedResult.examples).toEqual(directExtraction)
      expect(processedResult.hasChanges).toBe(directExtraction.length > 0)
    })

    it('maintains consistency between hasChanges and examples length', () => {
      const testCases = [
        { content: '', expectedHasChanges: false },
        { content: '```ts\nshort\n```', expectedHasChanges: false },
        { content: '```ts\nconst long = "This is long enough to be included"\n```', expectedHasChanges: true }
      ]

      testCases.forEach(({ content, expectedHasChanges }) => {
        const result = processFrameworkUpdate('test', { content })
        expect(result.hasChanges).toBe(expectedHasChanges)
        expect(result.hasChanges).toBe(result.examples.length > 0)
      })
    })
  })

  describe('Timestamp consistency', () => {
    it('generates consistent timestamps', () => {
      const docs = { content: 'Some content' }

      const result1 = processFrameworkUpdate('lib1', docs)
      const result2 = processFrameworkUpdate('lib2', docs)

      expect(result1.lastUpdated).toBe(result2.lastUpdated)
    })

    it('updates timestamp when called at different times', () => {
      const docs = { content: 'Some content' }

      const result1 = processFrameworkUpdate('lib', docs)

      // Advance time
      jest.advanceTimersByTime(1000)

      const result2 = processFrameworkUpdate('lib', docs)

      expect(result1.lastUpdated).not.toBe(result2.lastUpdated)
    })
  })
})