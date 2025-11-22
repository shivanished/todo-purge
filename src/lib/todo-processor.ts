import {readFileSync, writeFileSync} from 'node:fs'
import {relative} from 'node:path'
import type {TodoMatch} from './file-scanner.js'

export interface TodoContext {
  todo: TodoMatch
  contextAbove: string[]
  contextBelow: string[]
  fullContext: string
}

export function extractContext(todo: TodoMatch, linesAbove: number, linesBelow: number): TodoContext {
  const content = readFileSync(todo.filePath, 'utf-8')
  const lines = content.split('\n')
  const lineIndex = todo.lineNumber - 1

  // Extract lines above (handle file start)
  const startIndex = Math.max(0, lineIndex - linesAbove)
  const contextAbove = lines.slice(startIndex, lineIndex)

  // Extract lines below (handle file end)
  const endIndex = Math.min(lines.length, lineIndex + 1 + linesBelow)
  const contextBelow = lines.slice(lineIndex + 1, endIndex)

  // Create full context with line numbers
  const contextLines: string[] = []
  const contextStartLine = startIndex + 1

  // Add context above
  for (let i = 0; i < contextAbove.length; i++) {
    const lineNum = contextStartLine + i
    contextLines.push(`${lineNum.toString().padStart(4, ' ')} | ${contextAbove[i]}`)
  }

  // Add the TODO line itself
  contextLines.push(`${todo.lineNumber.toString().padStart(4, ' ')} | ${todo.line}`)

  // Add context below
  for (let i = 0; i < contextBelow.length; i++) {
    const lineNum = todo.lineNumber + 1 + i
    contextLines.push(`${lineNum.toString().padStart(4, ' ')} | ${contextBelow[i]}`)
  }

  const fullContext = contextLines.join('\n')

  return {
    todo,
    contextAbove,
    contextBelow,
    fullContext,
  }
}

export function formatTicketDescription(context: TodoContext): string {
  const relativePath = relative(process.cwd(), context.todo.filePath)
  const description = context.todo.description

  return `**TODO Comment Found**

${description}

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

  if (codeBeforeComment.length > 0) {
    lines[lineIndex] = codeBeforeComment
    writeFileSync(todo.filePath, lines.join('\n'), 'utf-8')
  }
}
