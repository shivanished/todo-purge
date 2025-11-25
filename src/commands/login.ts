import {Command, Flags} from '@oclif/core'
import {createInterface} from 'node:readline'
import {
  setLinearApiKey,
  setTeamId,
  hasLinearApiKey,
  getTeamId,
  getLinearApiKey,
  setOpenAIApiKey,
  hasOpenAIApiKey,
  hasSeenOpenAIWarning,
  setOpenAIWarningSeen,
} from '../lib/config.js'
import {LinearClient} from '../lib/linear.js'
import {OpenAIClient} from '../lib/openai.js'
import chalk from 'chalk'

export default class Login extends Command {
  static override description = 'Authenticate with Linear API and store credentials'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --switch-team',
    '<%= config.bin %> <%= command.id %> --openai-key=sk-67',
  ]

  static override flags = {
    'switch-team': Flags.boolean({
      description: 'Switch teams using your existing login',
      default: false,
    }),
    'openai-key': Flags.string({
      description: 'OpenAI API key for enhanced ticket descriptions',
    }),
  }

  private async prompt(question: string): Promise<string> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer)
      })
    })
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Login)
    const switchingTeam = Boolean(flags['switch-team'])
    const alreadyLoggedIn = hasLinearApiKey()

    if (flags['openai-key'] && alreadyLoggedIn && !switchingTeam) {
      await this.handleOpenAIKey(flags['openai-key'])
      return
    }

    if (switchingTeam && alreadyLoggedIn) {
      const storedApiKey = getLinearApiKey()
      if (!storedApiKey) {
        this.error(chalk.red('Stored API key is missing or invalid. Please log in again.'))
      }

      this.log(chalk.blue('Switching team using existing credentials...'))
      const client = new LinearClient(storedApiKey!.trim())

      try {
        await this.selectTeam(client, true)
        this.log(chalk.green('✓ Team selection updated.'))
        await this.handleOpenAIKey(flags['openai-key'])
      } catch (error) {
        this.error(
          chalk.red(
            `Failed to switch teams: ${error instanceof Error ? error.message : String(error)}. ` +
              'Try running `todo-purge login` without --switch-team to reauthenticate.',
          ),
        )
      }

      return
    }

    if (switchingTeam && !alreadyLoggedIn) {
      this.log(chalk.yellow('No existing login found. Proceeding with full login flow (run todo-purge login).'))
    }

    // Check if already logged in
    if (alreadyLoggedIn) {
      const overwrite = await this.prompt(
        chalk.yellow('You are already logged in. Overwrite existing credentials? (y/N): '),
      )
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        this.log(chalk.green('Login cancelled.'))
        return
      }
    }

    // Prompt for API key
    this.log(chalk.blue('Please enter your Linear API key.'))
    this.log(chalk.gray('You can create one at: https://linear.app/settings/api'))
    const apiKey = await this.prompt(chalk.cyan('API Key: '))

    if (!apiKey || !apiKey.trim()) {
      this.error(chalk.red('API key cannot be empty.'))
    }

    // Validate API key
    this.log(chalk.blue('Validating API key...'))
    const client = new LinearClient(apiKey.trim())

    try {
      const isValid = await client.validateApiKey()
      if (!isValid) {
        this.error(chalk.red('Invalid API key. Please check your API key and try again.'))
      }

      // Store API key
      setLinearApiKey(apiKey.trim())
      this.log(chalk.green('✓ API key validated and stored.'))

      await this.selectTeam(client)
      await this.handleOpenAIKey(flags['openai-key'])
    } catch (error) {
      this.error(chalk.red(`Failed to validate API key: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  private async selectTeam(client: LinearClient, forceReselect = false): Promise<void> {
    // Get teams and prompt for team selection
    const teams = await client.getTeams()
    if (teams.length === 0) {
      this.warn(chalk.yellow('No teams found. You may need to select a team later.'))
      return
    }

    if (!forceReselect) {
      // Check if team ID is already set
      const existingTeamId = getTeamId()
      if (existingTeamId) {
        const useExisting = await this.prompt(chalk.yellow(`Use existing team? (Y/n): `))
        if (useExisting.toLowerCase() !== 'n' && useExisting.toLowerCase() !== 'no') {
          this.log(chalk.green('Using existing team configuration.'))
          this.log(chalk.green('\nLogin successful! You can now run `todo-purge run` to process TODOs.'))
          return
        }
      }
    } else {
      this.log(chalk.blue('Please select the team you want to switch to.'))
    }

    // Prompt for team selection
    this.log(chalk.blue('\nAvailable teams:'))
    teams.forEach((team, index) => {
      this.log(chalk.cyan(`  ${index + 1}. ${team.name} (${team.key})`))
    })

    const teamChoice = await this.prompt(chalk.cyan(`\nSelect a team (1-${teams.length}): `))
    const teamIndex = parseInt(teamChoice, 10) - 1

    if (isNaN(teamIndex) || teamIndex < 0 || teamIndex >= teams.length) {
      this.warn(chalk.yellow('Invalid team selection. You can set it later by running login again.'))
      return
    }

    const selectedTeam = teams[teamIndex]
    setTeamId(selectedTeam.id)
    this.log(chalk.green(`✓ Team "${selectedTeam.name}" selected and stored.`))
    this.log(chalk.green('\nLogin successful! You can now run `todo-purge run` to process TODOs.'))
  }

  private async handleOpenAIKey(providedKey?: string): Promise<void> {
    // If key was provided via flag, use it
    if (providedKey) {
      if (!providedKey.trim()) {
        this.error(chalk.red('OpenAI API key cannot be empty.'))
      }

      this.log(chalk.blue('Validating OpenAI API key...'))
      const openAIClient = new OpenAIClient(providedKey.trim())

      try {
        const isValid = await openAIClient.validateApiKey()
        if (!isValid) {
          this.error(chalk.red('Invalid OpenAI API key. Please check your API key and try again.'))
        }

        setOpenAIApiKey(providedKey.trim())
        this.log(chalk.green('✓ OpenAI API key validated and stored.'))

        // Show first-time warning if not seen before
        if (!hasSeenOpenAIWarning()) {
          this.log(chalk.yellow('\nNote: Using OpenAI will consume API credits. You can disable it with --no-ai flag.'))
          setOpenAIWarningSeen()
        }
      } catch (error) {
        this.error(
          chalk.red(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : String(error)}`),
        )
      }

      return
    }

    // If key already exists, don't prompt
    if (hasOpenAIApiKey()) {
      return
    }

    // Otherwise, optionally prompt for it
    const addOpenAI = await this.prompt(
      chalk.yellow('\nWould you like to add an OpenAI API key for enhanced descriptions? (y/N): '),
    )

    if (addOpenAI.toLowerCase() !== 'y' && addOpenAI.toLowerCase() !== 'yes') {
      return
    }

    this.log(chalk.blue('Please enter your OpenAI API key.'))
    this.log(chalk.gray('You can create one at: https://platform.openai.com/api-keys'))
    const openAIKey = await this.prompt(chalk.cyan('OpenAI API Key: '))

    if (!openAIKey || !openAIKey.trim()) {
      this.error(chalk.red('OpenAI API key cannot be empty.'))
    }

    this.log(chalk.blue('Validating OpenAI API key...'))
    const openAIClient = new OpenAIClient(openAIKey.trim())

    try {
      const isValid = await openAIClient.validateApiKey()
      if (!isValid) {
        this.error(chalk.red('Invalid OpenAI API key. Please check your API key and try again.'))
      }

      setOpenAIApiKey(openAIKey.trim())
      this.log(chalk.green('✓ OpenAI API key validated and stored.'))

      // Show first-time warning if not seen before
      if (!hasSeenOpenAIWarning()) {
        this.log(chalk.yellow('\nNote: Using OpenAI will consume API credits. You can disable it with --no-ai flag.'))
        setOpenAIWarningSeen()
      }
    } catch (error) {
      this.error(
        chalk.red(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : String(error)}`),
      )
    }
  }
}
