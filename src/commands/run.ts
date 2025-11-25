import {Command, Flags} from '@oclif/core'
import {getLinearApiKey, getTeamId, hasLinearApiKey, hasOpenAIApiKey, getOpenAIApiKey} from '../lib/config.js'
import {LinearClient} from '../lib/linear.js'
import {OpenAIClient} from '../lib/openai.js'
import {scanDirectory} from '../lib/file-scanner.js'
import {extractContext, formatTicketDescription, removeTodoFromFile} from '../lib/todo-processor.js'
import {relative} from 'node:path'
import chalk from 'chalk'

export default class Run extends Command {
  static override description = 'Scan codebase for TODOs, create Linear tickets, and remove comments'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --context-lines=5,10',
    '<%= config.bin %> <%= command.id %> --keep-comments',
  ]

  static override flags = {
    'context-lines': Flags.string({
      description: 'Number of lines above and below TODO to include (format: above,below)',
      default: '5,10',
    }),
    'keep-comments': Flags.boolean({
      description: 'Keep TODO comments in files instead of removing them',
      default: false,
    }),
    'no-ai': Flags.boolean({
      description: 'Disable AI-generated descriptions even if OpenAI key is configured',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Run)

    // Check if logged in
    if (!hasLinearApiKey()) {
      this.error(chalk.red('Not logged in. Please run `todo-purge login` first to authenticate with Linear.'))
    }

    const apiKey = getLinearApiKey()!
    const teamId = getTeamId()

    if (!teamId) {
      this.error(chalk.red('No team selected. Please run `todo-purge login` to select a team.'))
    }

    // Parse context lines
    const contextLinesMatch = flags['context-lines'].match(/^(\d+),(\d+)$/)
    if (!contextLinesMatch) {
      this.error(chalk.red('Invalid context-lines format. Use format: above,below (e.g., 5,10)'))
    }

    const linesAbove = parseInt(contextLinesMatch[1]!, 10)
    const linesBelow = parseInt(contextLinesMatch[2]!, 10)

    if (linesAbove < 0 || linesBelow < 0) {
      this.error(chalk.red('Context lines must be non-negative numbers.'))
    }

    // Initialize Linear client
    const client = new LinearClient(apiKey)

    // Check if we should use AI generation
    const useAI = hasOpenAIApiKey() && !flags['no-ai']
    let openAIClient: OpenAIClient | null = null

    if (useAI) {
      const openAIKey = getOpenAIApiKey()
      if (openAIKey) {
        openAIClient = new OpenAIClient(openAIKey)
      }
    }

    // Scan for TODOs
    this.log(chalk.blue('Scanning codebase for TODO comments...'))
    const todos = scanDirectory(process.cwd())

    if (todos.length === 0) {
      this.log(chalk.green('No TODO comments found. Your codebase is clean!'))
      return
    }

    this.log(chalk.blue(`Found ${todos.length} TODO comment(s).\n`))

    // Show warning if using AI for many TODOs
    if (useAI && todos.length > 10) {
      this.log(
        chalk.yellow(`Generating AI descriptions for ${todos.length} TODOs. This will use your OpenAI API quota.\n`),
      )
    }

    // Process each TODO
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]!
      const relativePath = relative(process.cwd(), todo.filePath)

      this.log(chalk.cyan(`[${i + 1}/${todos.length}] Processing: ${relativePath}:${todo.lineNumber}`))

      try {
        const context = extractContext(todo, linesAbove, linesBelow)

        // Try to generate AI description if enabled
        let aiDescription: string | undefined
        if (useAI && openAIClient) {
          try {
            this.log(chalk.gray('  Generating AI description...'))
            aiDescription = await openAIClient.generateDescription(
              todo.description,
              relative(process.cwd(), todo.filePath),
              todo.lineNumber,
              context.fullContext,
            )
          } catch (error) {
            // Log error but continue with manual description
            const errorMessage = error instanceof Error ? error.message : String(error)
            this.log(chalk.yellow(`  OpenAI API error: ${errorMessage}. Continuing with manual description.`))
          }
        }

        const description = formatTicketDescription(context, aiDescription)

        // Create title from TODO description (truncate if too long)
        const title = todo.description.length > 100 ? `${todo.description.substring(0, 97)}...` : todo.description

        // Create Linear ticket
        this.log(chalk.gray('  Creating Linear ticket...'))
        const issue = await client.createIssue(teamId!, title, description)

        this.log(chalk.green(`  ✓ Created ticket: ${issue.identifier} - ${issue.title}`))
        this.log(chalk.gray(`  URL: ${issue.url}\n`))

        // Remove TODO from file (unless --keep-comments flag is set)
        if (!flags['keep-comments']) {
          removeTodoFromFile(todo)
          this.log(chalk.green(`  ✓ Removed TODO comment from ${relativePath}\n`))
        } else {
          this.log(chalk.gray(`  ✓ Kept TODO comment in ${relativePath} (--keep-comments flag enabled)\n`))
        }
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
