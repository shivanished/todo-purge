import {Command, Flags} from '@oclif/core'
import {getApiKey, getTeamId, hasApiKey} from '../lib/config.js'
import {LinearClient} from '../lib/linear.js'
import {scanDirectory} from '../lib/file-scanner.js'
import {extractContext, formatTicketDescription, removeTodoFromFile} from '../lib/todo-processor.js'
import {relative} from 'node:path'
import chalk from 'chalk'

export default class Run extends Command {
  static override description = 'Scan codebase for TODOs, create Linear tickets, and remove comments'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --context-lines=5,10',
  ]

  static override flags = {
    'context-lines': Flags.string({
      description: 'Number of lines above and below TODO to include (format: above,below)',
      default: '5,10',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Run)

    // Check if logged in
    if (!hasApiKey()) {
      this.error(
        chalk.red('Not logged in. Please run `cleanup login` first to authenticate with Linear.'),
      )
    }

    const apiKey = getApiKey()!
    const teamId = getTeamId()

    if (!teamId) {
      this.error(
        chalk.red('No team selected. Please run `cleanup login` to select a team.'),
      )
    }

    // Parse context lines
    const contextLinesMatch = flags['context-lines'].match(/^(\d+),(\d+)$/)
    if (!contextLinesMatch) {
      this.error(
        chalk.red('Invalid context-lines format. Use format: above,below (e.g., 5,10)'),
      )
    }

    const linesAbove = parseInt(contextLinesMatch[1]!, 10)
    const linesBelow = parseInt(contextLinesMatch[2]!, 10)

    if (linesAbove < 0 || linesBelow < 0) {
      this.error(chalk.red('Context lines must be non-negative numbers.'))
    }

    // Initialize Linear client
    const client = new LinearClient(apiKey)

    // Scan for TODOs
    this.log(chalk.blue('Scanning codebase for TODO comments...'))
    const todos = scanDirectory(process.cwd())

    if (todos.length === 0) {
      this.log(chalk.green('No TODO comments found. Your codebase is clean!'))
      return
    }

    this.log(chalk.blue(`Found ${todos.length} TODO comment(s).\n`))

    // Process each TODO
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]!
      const relativePath = relative(process.cwd(), todo.filePath)

      this.log(
        chalk.cyan(`[${i + 1}/${todos.length}] Processing: ${relativePath}:${todo.lineNumber}`),
      )

      try {
        // Extract context
        const context = extractContext(todo, linesAbove, linesBelow)

        // Format ticket description
        const description = formatTicketDescription(context)

        // Create title from TODO description (truncate if too long)
        const title = todo.description.length > 100
          ? `${todo.description.substring(0, 97)}...`
          : todo.description

        // Create Linear ticket
        this.log(chalk.gray('  Creating Linear ticket...'))
        const issue = await client.createIssue(teamId!, title, description)

        this.log(
          chalk.green(`  ✓ Created ticket: ${issue.identifier} - ${issue.title}`),
        )
        this.log(chalk.gray(`  URL: ${issue.url}\n`))

        // Remove TODO from file
        removeTodoFromFile(todo)
        this.log(chalk.green(`  ✓ Removed TODO comment from ${relativePath}\n`))
      } catch (error) {
        this.error(
          chalk.red(
            `\nFailed to process TODO at ${relativePath}:${todo.lineNumber}\n` +
            `Error: ${error instanceof Error ? error.message : String(error)}\n` +
            'Stopping processing.',
          ),
        )
      }
    }

    this.log(chalk.green(`\n✓ Successfully processed ${todos.length} TODO comment(s).`))
  }
}
