export function extractCodeExamples(content: string): string[] {
  const codeBlockRegex = /```(?:typescript|javascript|tsx|jsx|ts|js)\n([\s\S]*?)\n```/g
  const examples: string[] = []
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim()
    if (code.length > 50) {
      examples.push(code)
    }
  }

  return examples
}

export function processFrameworkUpdate(libraryId: string, docs: any) {
  const codeExamples = extractCodeExamples(docs.content)
  const hasNewContent = codeExamples.length > 0
  
  return {
    libraryId,
    hasChanges: hasNewContent,
    examples: codeExamples.slice(0, 3),
    lastUpdated: new Date().toISOString()
  }
}