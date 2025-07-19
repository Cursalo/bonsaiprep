interface Context7Response {
  content: string
  examples?: string[]
  lastUpdated: string
}

export class Context7Client {
  private baseUrl: string

  constructor(baseUrl = '/api/mcp/context7') {
    this.baseUrl = baseUrl
  }

  async resolveLibraryId(libraryName: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryName })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const { libraryId } = await response.json()
      return libraryId
    } catch (error) {
      console.error('Error resolving library ID:', error)
      return null
    }
  }

  async getLibraryDocs(
    context7CompatibleLibraryID: string,
    options: {
      tokens?: number
      topic?: string
    } = {}
  ): Promise<Context7Response | null> {
    try {
      const response = await fetch(`${this.baseUrl}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context7CompatibleLibraryID,
          tokens: options.tokens || 10000,
          topic: options.topic
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const { content } = await response.json()
      
      return {
        content,
        examples: this.extractCodeExamples(content),
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting library docs:', error)
      return null
    }
  }

  private extractCodeExamples(content: string): string[] {
    const codeBlockRegex = /```(?:typescript|javascript|tsx|jsx|ts|js)\n([\s\S]*?)\n```/g
    const examples: string[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim()
      if (code.length > 50) {
        examples.push(code)
      }
    }

    return examples.slice(0, 5) // Return max 5 examples
  }

  async getFrameworkUpdates(frameworks: string[]): Promise<any[]> {
    const updates = await Promise.all(
      frameworks.map(async (framework) => {
        const libraryId = await this.resolveLibraryId(framework)
        if (!libraryId) return null

        const docs = await this.getLibraryDocs(libraryId, {
          tokens: 15000,
          topic: 'latest-features'
        })

        if (!docs) return null

        return {
          framework,
          libraryId,
          hasChanges: docs.examples && docs.examples.length > 0,
          examples: docs.examples || [],
          lastUpdated: docs.lastUpdated
        }
      })
    )

    return updates.filter(update => update !== null && update.hasChanges)
  }
}

export const context7Client = new Context7Client()