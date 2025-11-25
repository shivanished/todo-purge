import {readdirSync, statSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'

export interface TodoMatch {
  filePath: string
  lineNumber: number
  line: string
  match: string
  description: string
}

const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME)(\([^)]+\))?\s*:\s*(.+)/i, //
  /#\s*(TODO|FIXME)(\([^)]+\))?\s*:\s*(.+)/i,
]

// Directories to exclude
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  '.nyc_output',
  '.vscode',
  '.idea',
  'bin',
])

export function scanDirectory(rootDir: string): TodoMatch[] {
  const todos: TodoMatch[] = []
  const rootPath = process.cwd()

  function scanDir(dir: string): void {
    try {
      const entries = readdirSync(dir)

      for (const entry of entries) {
        const fullPath = join(dir, entry)
        const stats = statSync(fullPath)

        if (stats.isDirectory()) {
          if (EXCLUDED_DIRS.has(entry)) {
            continue
          }
          scanDir(fullPath)
          continue
        }
``
        if (stats.isFile() && isSourceFile(entry)) {
          const fileTodos = scanFile(fullPath)
          todos.push(...fileTodos)
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
        return
      }
      throw error
    }
  }

  scanDir(rootDir)
  return todos
}

function isSourceFile(filename: string): boolean {
  const sourceExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.py',
    '.java',
    '.go',
    '.rs',
    '.cpp',
    '.c',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.rb',
    '.swift',
    '.kt',
    '.scala',
    '.m',
    '.mm',
    '.vue',
    '.svelte',
    '.dart',
    '.r',
    '.sql',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.yaml',
    '.yml',
    '.json',
    '.md',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.styl',
  ]
  return sourceExtensions.some(ext => filename.endsWith(ext))
}

function scanFile(filePath: string): TodoMatch[] {
  const todos: TodoMatch[] = []

  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      for (const pattern of TODO_PATTERNS) {
        const match = line.match(pattern)
        if (match) {
          const description = match[3] || match[0]
          todos.push({
            filePath,
            lineNumber,
            line,
            match: match[0],
            description: description.trim(),
          })
          break
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
      return todos
    }
    throw error
  }

  return todos
}

