import {readdirSync, statSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'

export interface TodoMatch {
  filePath: string
  lineNumber: number
  line: string
  match: string
  description: string
}

// Patterns to match TODO/FIXME comments
// Matches: // TODO: description, # TODO: description, // TODO(issue): description, // FIXME: description
const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME)(\([^)]+\))?\s*:\s*(.+)/i, // // TODO: or // FIXME: or // TODO(issue):
  /#\s*(TODO|FIXME)(\([^)]+\))?\s*:\s*(.+)/i, // # TODO: or # FIXME: or # TODO(issue):
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
        const relativePath = relative(rootPath, fullPath)
        const stats = statSync(fullPath)

        // Skip excluded directories
        if (stats.isDirectory()) {
          if (EXCLUDED_DIRS.has(entry)) {
            continue
          }
          scanDir(fullPath)
          continue
        }

        // Only process text files (common source code extensions)
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
          // Extract description (the part after TODO/FIXME:)
          const description = match[3] || match[0]
          todos.push({
            filePath,
            lineNumber,
            line,
            match: match[0],
            description: description.trim(),
          })
          break // Only match once per line
        }
      }
    }
  } catch (error) {
    // Skip files we can't read
    if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
      return todos
    }
    throw error
  }

  return todos
}

