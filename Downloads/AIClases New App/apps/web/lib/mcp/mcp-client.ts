import { Client } from '@modelcontextprotocol/client'
import { spawn } from 'child_process'

class MCPClient {
  private client: Client | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      const serverProcess = spawn('npx', ['-y', '@upstash/context7-mcp'], {
        stdio: 'pipe'
      })

      this.client = new Client({
        name: 'aiclases-mcp-client',
        version: '1.0.0'
      }, {
        read: () => new Promise((resolve) => {
          serverProcess.stdout.once('data', (data) => {
            resolve(JSON.parse(data.toString()))
          })
        }),
        write: (data) => {
          serverProcess.stdin.write(JSON.stringify(data) + '\n')
          return Promise.resolve()
        }
      })

      await this.client.connect()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize MCP client:', error)
      throw error
    }
  }

  async callTool(toolName: string, params: Record<string, any>) {
    if (!this.client) {
      await this.initialize()
    }

    if (!this.client) {
      throw new Error('MCP client not initialized')
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: params
      })

      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0]
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error)
      throw error
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.initialized = false
    }
  }
}

export const mcpClient = new MCPClient()