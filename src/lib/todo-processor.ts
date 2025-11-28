import {readFileSync, writeFileSync} from 'node:fs'
import {relative} from 'node:path'
import type {TodoMatch} from './file-scanner.js'
import {OpenAIClient} from './openai.js'

export interface TodoContext {
  todo: TodoMatch
  contextAbove: string[]
  contextBelow: string[]
  fullContext: string
  fullFileContent: string
}

function getFixedContext(
  todo: TodoMatch,
  lines: string[],
  linesAbove: number,
  linesBelow: number,
): { contextAbove: string[]; contextBelow: string[]; fullContext: string } {
  const lineIndex = todo.lineNumber - 1

  const startIndex = Math.max(0, lineIndex - linesAbove)
  const contextAbove = lines.slice(startIndex, lineIndex)

  const endIndex = Math.min(lines.length, lineIndex + 1 + linesBelow)
  const contextBelow = lines.slice(lineIndex + 1, endIndex)

  const contextLines: string[] = []
  const contextStartLine = startIndex + 1

  for (let i = 0; i < contextAbove.length; i++) {
    const lineNum = contextStartLine + i
    contextLines.push(`${lineNum.toString().padStart(4, ' ')} | ${contextAbove[i]}`)
  }

  contextLines.push(`${todo.lineNumber.toString().padStart(4, ' ')} | ${todo.line}`)

  for (let i = 0; i < contextBelow.length; i++) {
    const lineNum = todo.lineNumber + 1 + i
    contextLines.push(`${lineNum.toString().padStart(4, ' ')} | ${contextBelow[i]}`)
  }

  const fullContext = contextLines.join('\n')
  return { contextAbove, contextBelow, fullContext }
}

export async function extractContext(
  todo: TodoMatch,
  linesAbove: number,
  linesBelow: number,
  useAI: boolean,
  openAIClient?: OpenAIClient,
): Promise<TodoContext> {
  const content = readFileSync(todo.filePath, 'utf-8')
  const lines = content.split('\n')
  const lineIndex = todo.lineNumber - 1

  let fullContext: string
  let contextAbove: string[]
  let contextBelow: string[]

  // If AI is enabled, use AI to generate smart context
  if (useAI && openAIClient) {
    try {
      fullContext = await openAIClient.generateContext(todo.description, todo.filePath, todo.lineNumber, content)
      const contextLines = fullContext.split('\n')
      const todoLineFormatted = `${todo.lineNumber.toString().padStart(4, ' ')} | ${todo.line}`
      const todoLineIndex = contextLines.findIndex((line) => line.trim() === todoLineFormatted.trim())

      if (todoLineIndex >= 0) {
        contextAbove = contextLines.slice(0, todoLineIndex).map((line) => {
          const match = line.match(/\s+\d+\s+\|\s+(.*)/)
          return match ? match[1]! : line
        })
        contextBelow = contextLines.slice(todoLineIndex + 1).map((line) => {
          const match = line.match(/\s+\d+\s+\|\s+(.*)/)
          return match ? match[1]! : line
        })
      } else {
        contextAbove = []
        contextBelow = []
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to generate AI context, falling back to fixed lines: ${errorMessage}`)

      const fixed = getFixedContext(todo, lines, linesAbove, linesBelow)
      contextAbove = fixed.contextAbove
      contextBelow = fixed.contextBelow
      fullContext = fixed.fullContext
    }
  } else {
    const fixed = getFixedContext(todo, lines, linesAbove, linesBelow)
    contextAbove = fixed.contextAbove
    contextBelow = fixed.contextBelow
    fullContext = fixed.fullContext
  }

  return {
    todo,
    contextAbove,
    contextBelow,
    fullContext,
    fullFileContent: content,
  }
}

export function formatTicketDescription(context: TodoContext, aiDescription?: string): string {
  const relativePath = relative(process.cwd(), context.todo.filePath)
  const description = aiDescription ?? context.todo.description

  return `${description}

  **Location:** \`${relativePath}:${context.todo.lineNumber}\`

  **Code Context:**
  \`\`\`
  ${context.fullContext}
  \`\`\`
  `
}

export function removeTodoFromFile(todo: TodoMatch): void {
  const content = readFileSync(todo.filePath, 'utf-8')
  const lines = content.split('\n')
  const lineIndex = todo.lineNumber - 1
  const originalLine = lines[lineIndex]!
  const matchIndex = originalLine.indexOf(todo.match)

  if (matchIndex === -1) {
    return
  }

  let commentStartIndex = -1

  for (let i = matchIndex; i >= 0; i--) {
    if (originalLine.substring(i, i + 2) === '//') {
      commentStartIndex = i
      break
    }
  }

  if (commentStartIndex === -1) {
    for (let i = matchIndex; i >= 0; i--) {
      if (originalLine[i] === '#') {
        commentStartIndex = i
        break
      }
    }
  }

  if (commentStartIndex === -1) {
    return
  }

  const codeBeforeComment = originalLine.substring(0, commentStartIndex).trimEnd()

  if (codeBeforeComment.length >= 0) {
    lines[lineIndex] = codeBeforeComment
    writeFileSync(todo.filePath, lines.join('\n'), 'utf-8')
  }
}
