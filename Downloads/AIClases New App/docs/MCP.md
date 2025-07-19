# AIClases 4.0 - Integración MCP (Model Context Protocol)

## 🔌 Visión General MCP

### ¿Qué es MCP en AIClases?
El **Model Context Protocol** es la columna vertebral que permite que nuestros cursos se auto-actualicen con información fresca del ecosistema IA. MCP conecta nuestra plataforma con fuentes de datos externos para:

- 🔍 **Búsquedas inteligentes** de tendencias IA recientes
- 📊 **Extracción de datos** de repositorios y papers
- 🌐 **Fetching HTTP** de APIs especializadas
- 🗂️ **Gestión de contenido** versionado con Context7
- 💾 **Operaciones de base de datos** optimizadas

### Arquitectura MCP en AIClases
```mermaid
graph TB
    A[Cron Nightly] --> B[MCP Orchestrator]
    B --> C[brave.search]
    B --> D[fetch.http]
    B --> E[@upstash/context7-mcp]
    B --> F[supabase.query]
    
    C --> G[AI News/Trends]
    D --> H[GitHub Repos/APIs]
    E --> I[Framework Documentation]
    F --> J[Content Storage]
    
    G --> K[GPT-4o Processing]
    H --> K
    I --> K
    K --> L[Course Content Update]
    L --> F
    
    M[Usuario en Lección] --> N[DynamicCodeExample]
    N --> O[context7.resolveLibraryId]
    O --> P[context7.getLibraryDocs]
    P --> Q[Fresh Code Examples]
```

## 🔍 MCP Tool: brave.search

### Propósito
Búsquedas inteligentes de tendencias, noticias y contenido relevante de IA para mantener cursos actualizados.

### Configuración
```typescript
// lib/mcp/brave-search.ts
import { BraveSearchMCP } from '@aiclases/ai'

const braveConfig = {
  apiKey: process.env.BRAVE_API_KEY!,
  country: 'global',
  search_lang: 'es,en,pt',
  safesearch: 'moderate',
  freshness: 'pw' // Past week
}

export const braveSearch = new BraveSearchMCP(braveConfig)
```

### Ejemplos de Uso

#### 1. Búsqueda de Tendencias IA Semanales
```typescript
// app/api/cron/update-trends/route.ts
export async function GET() {
  try {
    // Búsqueda de tendencias generales
    const aiTrends = await braveSearch.query({
      q: 'artificial intelligence trends 2025 -ads -sponsored',
      count: 10,
      offset: 0,
      country: 'US',
      freshness: 'pw' // Past week
    })

    // Búsqueda específica por categorías
    const searches = [
      'GPT-5 OpenAI release news',
      'Claude 4 Anthropic updates', 
      'Google Gemini new features',
      'AI coding tools 2025 comparison',
      'machine learning papers arxiv recent'
    ]

    const results = await Promise.all(
      searches.map(query => braveSearch.query({ q: query, count: 5 }))
    )

    // Procesar resultados para cursos
    const processedContent = await processSearchResults(results)
    
    return Response.json({ 
      success: true, 
      trends: processedContent,
      updated_courses: await updateCoursesWithTrends(processedContent)
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

#### 2. Búsqueda Contextual en Lecciones
```typescript
// components/FetchLatest.tsx
import { braveSearch } from '@/lib/mcp/brave-search'

export function FetchLatest({ 
  topic, 
  courseContext, 
  maxResults = 3 
}: {
  topic: string
  courseContext: string
  maxResults?: number
}) {
  const [latestContent, setLatestContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLatestExamples() {
      try {
        const searchQuery = `${topic} ${courseContext} example tutorial 2025 -outdated`
        
        const results = await fetch('/api/search/contextualized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: searchQuery,
            context: courseContext,
            max_results: maxResults 
          })
        })
        
        const data = await results.json()
        setLatestContent(data.processed_results)
      } catch (error) {
        console.error('Error fetching latest content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestExamples()
  }, [topic, courseContext])

  if (loading) return <SkeletonLoader />

  return (
    <div className="latest-content-block border-l-4 border-blue-500 pl-4 my-6">
      <h4 className="font-semibold text-blue-700 dark:text-blue-300">
        🔥 Ejemplos Recientes ({topic})
      </h4>
      {latestContent?.map((item, index) => (
        <div key={index} className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <h5 className="font-medium">{item.title}</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {item.summary}
          </p>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Ver ejemplo completo →
          </a>
        </div>
      ))}
    </div>
  )
}
```

#### 3. Análisis de Competencia
```typescript
// lib/mcp/competitive-analysis.ts
export async function analyzeCompetitors() {
  const competitors = [
    'coursera artificial intelligence courses',
    'udemy ai programming 2025',
    'deeplearning.ai new courses',
    'fast.ai latest updates'
  ]

  const competitorData = await Promise.all(
    competitors.map(async (query) => {
      const results = await braveSearch.query({
        q: query,
        count: 5,
        freshness: 'pm' // Past month
      })
      
      return {
        query,
        results: results.web?.results || [],
        analysis: await analyzeWithGPT(results)
      }
    })
  )

  return competitorData
}
```

## 🌐 MCP Tool: fetch.http

### Propósito
Conexión directa con APIs externas para obtener datos estructurados: GitHub repos, arXiv papers, documentación oficial, etc.

### Configuración
```typescript
// lib/mcp/http-fetcher.ts
export class HTTPFetcher {
  private baseConfig = {
    timeout: 10000,
    retries: 3,
    headers: {
      'User-Agent': 'AIClases-ContentUpdater/1.0'
    }
  }

  async fetchWithFallback(urls: string[], options?: RequestInit) {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          ...this.baseConfig,
          ...options
        })
        
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.warn(`Failed to fetch ${url}:`, error.message)
        continue
      }
    }
    throw new Error('All fetch attempts failed')
  }
}

export const httpFetcher = new HTTPFetcher()
```

### Ejemplos de Uso

#### 1. GitHub Trending Repositories
```typescript
// lib/mcp/github-integration.ts
export async function fetchTrendingAIRepos() {
  const endpoints = [
    'https://api.github.com/search/repositories?q=artificial-intelligence+language:python+created:>2024-12-01&sort=stars&order=desc',
    'https://api.github.com/search/repositories?q=machine-learning+language:typescript+created:>2024-12-01&sort=stars&order=desc',
    'https://api.github.com/search/repositories?q=gpt+openai+created:>2024-11-01&sort=updated&order=desc'
  ]

  try {
    const repoData = await Promise.all(
      endpoints.map(url => httpFetcher.fetchWithFallback([url], {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }))
    )

    const processedRepos = repoData.flatMap(data => 
      data.items.slice(0, 5).map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        updated: repo.updated_at,
        topics: repo.topics || []
      }))
    )

    return processedRepos
  } catch (error) {
    console.error('Error fetching GitHub repos:', error)
    return []
  }
}
```

#### 2. arXiv Papers Integration
```typescript
// lib/mcp/arxiv-integration.ts
export async function fetchLatestAIPapers(category = 'cs.AI', maxResults = 10) {
  const arxivAPI = 'http://export.arxiv.org/api/query'
  const query = `search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`
  
  try {
    const response = await httpFetcher.fetchWithFallback([`${arxivAPI}?${query}`])
    
    // Parse XML response (arXiv returns XML)
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(response, 'text/xml')
    
    const entries = Array.from(xmlDoc.querySelectorAll('entry'))
    
    return entries.map(entry => ({
      title: entry.querySelector('title')?.textContent?.trim(),
      summary: entry.querySelector('summary')?.textContent?.trim(),
      authors: Array.from(entry.querySelectorAll('author name')).map(
        author => author.textContent
      ),
      publishedDate: entry.querySelector('published')?.textContent,
      arxivId: entry.querySelector('id')?.textContent?.split('/').pop(),
      categories: Array.from(entry.querySelectorAll('category')).map(
        cat => cat.getAttribute('term')
      ),
      pdfUrl: entry.querySelector('link[type="application/pdf"]')?.getAttribute('href')
    }))
  } catch (error) {
    console.error('Error fetching arXiv papers:', error)
    return []
  }
}
```

#### 3. News APIs Integration
```typescript
// lib/mcp/news-aggregator.ts
export async function fetchAINews() {
  const newsSources = [
    {
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      type: 'rss'
    },
    {
      name: 'VentureBeat AI', 
      url: 'https://venturebeat.com/ai/feed/',
      type: 'rss'
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog/rss.xml',
      type: 'rss'
    }
  ]

  const newsResults = await Promise.all(
    newsSources.map(async (source) => {
      try {
        const rssData = await httpFetcher.fetchWithFallback([source.url])
        return {
          source: source.name,
          articles: await parseRSSFeed(rssData)
        }
      } catch (error) {
        return { source: source.name, articles: [] }
      }
    })
  )

  return newsResults
}
```

## 🗂️ MCP Tool: @upstash/context7-mcp

### Propósito
Acceso directo a documentación actualizada de frameworks y librerías para mantener ejemplos de código siempre vigentes.

### Configuración MCP Server
```bash
# Instalación global
npm install -g @upstash/context7-mcp

# O usando npx (recomendado)
npx -y @upstash/context7-mcp
```

### Configuración para Claude Desktop
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Configuración para Desarrollo Local
```typescript
// lib/mcp/context7-client.ts
import { Context7Client } from '@modelcontextprotocol/client'

export class Context7Integration {
  private client: Context7Client

  async resolveLibraryId(libraryName: string) {
    return await this.client.callTool('resolve-library-id', {
      libraryName
    })
  }

  async getLibraryDocs(libraryId: string, options = {}) {
    return await this.client.callTool('get-library-docs', {
      context7CompatibleLibraryID: libraryId,
      tokens: 10000,
      ...options
    })
  }
}
```

### Ejemplos de Uso

#### 1. Sincronización de Documentación
```typescript
// lib/mcp/context7-sync.ts
export async function syncFrameworkDocs() {
  const frameworks = [
    '/vercel/next.js',
    '/supabase/supabase', 
    '/tailwindlabs/tailwindcss',
    '/facebook/react'
  ]

  const docUpdates = await Promise.all(
    frameworks.map(async (libraryId) => {
      try {
        // Obtener documentación actualizada via MCP
        const response = await fetch('/api/mcp/context7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'get-library-docs',
            params: {
              context7CompatibleLibraryID: libraryId,
              tokens: 15000,
              topic: 'latest-features'
            }
          })
        })

        const { content } = await response.json()
        
        // Procesar cambios relevantes para cursos
        const relevantChanges = await extractRelevantChanges(content, libraryId)

        return {
          libraryId,
          hasUpdates: relevantChanges.length > 0,
          changes: relevantChanges,
          lastUpdated: new Date().toISOString()
        }
      } catch (error) {
        console.error(`Error syncing ${libraryId} docs:`, error)
        return {
          libraryId,
          hasUpdates: false,
          error: error.message
        }
      }
    })
  )

  return docUpdates.filter(update => update.hasUpdates)
}
```

#### 2. Ejemplos Dinámicos en Componentes
```typescript
// components/DynamicCodeExample.tsx
export function DynamicCodeExample({ 
  framework, 
  topic, 
  fallbackCode 
}: {
  framework: string
  topic: string
  fallbackCode: string
}) {
  const [currentExample, setCurrentExample] = useState(fallbackCode)
  const [isLatest, setIsLatest] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLatestExample() {
      try {
        // Paso 1: Resolver nombre de framework a ID Context7
        const resolveResponse = await fetch('/api/mcp/context7/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ libraryName: framework })
        })
        
        const { libraryId } = await resolveResponse.json()
        
        // Paso 2: Obtener documentación específica
        const docsResponse = await fetch('/api/mcp/context7/docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context7CompatibleLibraryID: libraryId,
            topic: topic,
            tokens: 5000
          })
        })

        const { content } = await docsResponse.json()
        
        // Paso 3: Extraer ejemplos de código actualizados
        const codeExamples = extractCodeExamples(content)
        
        if (codeExamples.length > 0) {
          setCurrentExample(codeExamples[0])
          setIsLatest(true)
        }
      } catch (error) {
        console.warn('Using fallback code example:', error.message)
        setCurrentExample(fallbackCode)
        setIsLatest(false)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestExample()
  }, [framework, topic, fallbackCode])

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="code-example-container">
      {isLatest && (
        <div className="mb-2 flex items-center gap-2 text-sm text-green-600">
          <Badge variant="outline" className="border-green-500">
            🔄 Actualizado desde documentación oficial
          </Badge>
        </div>
      )}
      
      <SyntaxHighlighter
        language="typescript"
        style={vsDark}
        customStyle={{
          borderRadius: '8px',
          border: isLatest ? '2px solid #10b981' : '1px solid #374151'
        }}
      >
        {currentExample}
      </SyntaxHighlighter>
    </div>
  )
}
```

#### 3. API Routes para Context7 MCP
```typescript
// app/api/mcp/context7/resolve/route.ts
export async function POST(request: Request) {
  try {
    const { libraryName } = await request.json()
    
    // Llamar al MCP server Context7
    const resolved = await mcpClient.callTool('resolve-library-id', {
      libraryName
    })
    
    return Response.json({ 
      libraryId: resolved.selected || resolved.results?.[0]?.libraryId 
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// app/api/mcp/context7/docs/route.ts
export async function POST(request: Request) {
  try {
    const params = await request.json()
    
    const docs = await mcpClient.callTool('get-library-docs', params)
    
    return Response.json({ content: docs.content })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
        }
      } catch (error) {
        console.warn('Using fallback code example:', error.message)
        setCurrentExample(fallbackCode)
        setIsLatest(false)
      }
    }

    fetchLatestExample()
  }, [framework, topic, fallbackCode])

  return (
    <div className="code-example-container">
      {isLatest && (
        <div className="mb-2 flex items-center gap-2 text-sm text-green-600">
          <Badge variant="outline" className="border-green-500">
            🔄 Actualizado desde documentación oficial
          </Badge>
        </div>
      )}
      
      <SyntaxHighlighter
        language="typescript"
        style={vsDark}
        customStyle={{
          borderRadius: '8px',
          border: isLatest ? '2px solid #10b981' : '1px solid #374151'
        }}
      >
        {currentExample}
      </SyntaxHighlighter>
    </div>
  )
}
```

## 💾 MCP Tool: supabase.query

### Propósito
Operaciones optimizadas de base de datos para gestionar contenido dinámico y analíticas de aprendizaje.

### Configuración
```typescript
// lib/mcp/supabase-mcp.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseMCP = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Ejemplos de Uso

#### 1. Actualización Masiva de Contenido
```typescript
// lib/mcp/content-updater.ts
export async function updateCourseContent(updates: ContentUpdate[]) {
  try {
    // Transacción para múltiples actualizaciones
    const { data, error } = await supabaseMCP.rpc('update_course_content_batch', {
      updates_json: JSON.stringify(updates)
    })

    if (error) throw error

    // Actualizar metadatos de freshness
    await supabaseMCP
      .from('courses')
      .update({ 
        last_content_update: new Date().toISOString(),
        auto_update_version: supabaseMCP.raw('auto_update_version + 1')
      })
      .in('id', updates.map(u => u.courseId))

    // Invalidar cache
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REVALIDATE_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: ['courses', ...updates.map(u => `course-${u.courseId}`)]
      })
    })

    return { success: true, updated: data?.length || 0 }
  } catch (error) {
    console.error('Error updating course content:', error)
    throw error
  }
}
```

#### 2. Analytics de Contenido Dinámico
```typescript
// lib/mcp/content-analytics.ts
export async function analyzeContentFreshness() {
  const { data: courses } = await supabaseMCP
    .from('courses')
    .select(`
      id,
      title,
      last_content_update,
      auto_update_version,
      lessons:lessons(
        id,
        dynamic_content_blocks,
        last_dynamic_update
      )
    `)

  const analytics = courses?.map(course => {
    const totalDynamicBlocks = course.lessons.reduce(
      (acc, lesson) => acc + (lesson.dynamic_content_blocks?.length || 0), 
      0
    )
    
    const avgBlockAge = course.lessons.reduce((acc, lesson) => {
      const blockAges = lesson.dynamic_content_blocks?.map(block => 
        Date.now() - new Date(block.last_updated).getTime()
      ) || []
      return acc + (blockAges.reduce((a, b) => a + b, 0) / blockAges.length || 0)
    }, 0) / course.lessons.length

    return {
      courseId: course.id,
      title: course.title,
      totalDynamicBlocks,
      avgBlockAgeHours: avgBlockAge / (1000 * 60 * 60),
      freshnessScore: Math.max(0, 100 - (avgBlockAge / (1000 * 60 * 60 * 24 * 7))) // 0-100 based on week freshness
    }
  })

  return analytics
}
```

#### 3. Migración de Datos con MCP
```typescript
// supabase/functions/migrate-content/index.ts
export async function migrateContentToMCP() {
  // 1. Exportar contenido actual
  const { data: existingContent } = await supabaseMCP
    .from('lessons')
    .select('id, content, metadata')
    .eq('requires_migration', true)

  // 2. Procesar con MCP tools
  const migratedContent = await Promise.all(
    existingContent?.map(async (lesson) => {
      // Identificar bloques estáticos vs dinámicos
      const dynamicBlocks = identifyDynamicBlocks(lesson.content)
      
      // Configurar MCP fetchers para cada bloque dinámico
      const mcpConfigs = dynamicBlocks.map(block => ({
        type: block.type, // 'brave-search', 'context7-docs', 'fetch-http'
        query: block.originalQuery,
        libraryId: block.libraryId, // Para Context7 MCP
        refreshInterval: block.refreshInterval || '24h'
      }))

      return {
        lessonId: lesson.id,
        staticContent: removeBlocksFromContent(lesson.content, dynamicBlocks),
        dynamicBlockConfigs: mcpConfigs
      }
    }) || []
  )

  // 3. Actualizar base de datos
  await Promise.all(
    migratedContent.map(async (content) => {
      return supabaseMCP
        .from('lessons')
        .update({
          content: content.staticContent,
          dynamic_content_blocks: content.dynamicBlockConfigs,
          requires_migration: false,
          migrated_at: new Date().toISOString()
        })
        .eq('id', content.lessonId)
    })
  )

  return { migrated: migratedContent.length }
}
```

## 🔄 Orquestación y Flujos de Trabajo

### Cron Job Principal
```typescript
// app/api/cron/mcp-orchestrator/route.ts
export async function GET(request: Request) {
  const cronSecret = request.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Ejecutar todas las fuentes MCP en paralelo
    const [
      braveResults,
      context7Updates,
      githubRepos, 
      arxivPapers,
      newsUpdates
    ] = await Promise.allSettled([
      braveSearch.query({ q: 'artificial intelligence news last week', count: 20 }),
      syncFrameworkDocs(), // Context7 MCP
      fetchTrendingAIRepos(),
      fetchLatestAIPapers('cs.AI', 15),
      fetchAINews()
    ])

    // 2. Procesar resultados con IA
    const processedUpdates = await processWithGPT({
      trends: braveResults.status === 'fulfilled' ? braveResults.value : null,
      docs: context7Updates.status === 'fulfilled' ? context7Updates.value : [],
      repos: githubRepos.status === 'fulfilled' ? githubRepos.value : [],
      papers: arxivPapers.status === 'fulfilled' ? arxivPapers.value : [],
      news: newsUpdates.status === 'fulfilled' ? newsUpdates.value : []
    })

    // 3. Actualizar contenido en Supabase
    const updateResults = await updateCourseContent(processedUpdates)

    // 4. Registrar métricas
    await logMCPMetrics({
      execution_time: Date.now() - startTime,
      sources_updated: processedUpdates.length,
      courses_affected: updateResults.updated,
      errors: [braveResults, context7Updates, githubRepos, arxivPapers, newsUpdates]
        .filter(r => r.status === 'rejected').length
    })

    return Response.json({
      success: true,
      summary: {
        sources_processed: 5,
        content_blocks_updated: processedUpdates.length,
        courses_refreshed: updateResults.updated
      }
    })
  } catch (error) {
    console.error('MCP Orchestrator error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### Error Handling y Fallbacks
```typescript
// lib/mcp/error-handling.ts
export class MCPErrorHandler {
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    try {
      return await primary()
    } catch (primaryError) {
      console.warn(`MCP primary failed (${errorContext}):`, primaryError.message)
      
      try {
        return await fallback()
      } catch (fallbackError) {
        console.error(`MCP fallback failed (${errorContext}):`, fallbackError.message)
        throw new Error(`All MCP attempts failed for ${errorContext}`)
      }
    }
  }

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries - 1) throw error
        
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }
}
```

Esta integración MCP asegura que AIClases siempre tenga contenido fresco y relevante, diferenciándose de plataformas tradicionales con contenido estático.