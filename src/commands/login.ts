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
  hasSeenAIWarning,
  setAIWarningSeen,
  getAllWorkspaces,
  addWorkspace,
  setActiveWorkspace,
  getActiveWorkspace,
  readConfig,
  removeWorkspace,
  setAIEnabled,
  type Workspace,
} from '../lib/config.js'
import {LinearClient} from '../lib/linear.js'
import {OpenAIClient} from '../lib/openai.js'
import chalk from 'chalk'

export default class Login extends Command {
  static override description = 'Authenticate with Linear API, store credentials, and optionally add an OpenAI API key'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --switch-team',
    '<%= config.bin %> <%= command.id %> --openai-key=sk-67',
    '<%= config.bin %> <%= command.id %> --gemini-key=AI67',
  ]

  static override flags = {
    'switch-team': Flags.boolean({
      description: 'Switch teams using your existing login',
      default: false,
    }),
    'openai-key': Flags.string({
      description: 'OpenAI API key for enhanced ticket descriptions',
    }),
    'gemini-key': Flags.string({
      description: 'Gemini API key for enhanced ticket descriptions',
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

    if (flags['openai-key'] && hasLinearApiKey() && !switchingTeam) {
      await this.handleOpenAIKey(flags['openai-key'])
      return
    }

    if (switchingTeam) {
      await this.handleSwitchTeam()
      await this.handleOpenAIKey(flags['openai-key'])
      return
    }

    // Regular login flow - add a new workspace
    await this.handleNewWorkspace()
    await this.handleOpenAIKey(flags['openai-key'])
  }

  private async handleSwitchTeam(): Promise<void> {
    const workspaces = getAllWorkspaces()

    if (workspaces.length === 0) {
      this.log(chalk.yellow('No saved workspaces found. Adding a new workspace...'))
      await this.addNewWorkspace()
      return
    }

    // Get active workspace index
    const config = readConfig()
    const activeIndex = config.activeWorkspaceIndex ?? 0

    // Show existing workspaces
    this.log(chalk.blue('\nSaved workspaces:'))
    workspaces.forEach((workspace, index) => {
      const activeMarker = index === activeIndex ? chalk.green(' (active)') : ''
      this.log(chalk.cyan(`  ${index + 1}. ${workspace.teamName} (${workspace.teamKey})${activeMarker}`))
    })
    this.log(chalk.cyan(`  ${workspaces.length + 1}. Add new workspace`))
    this.log(chalk.cyan(`  ${workspaces.length + 2}. Delete workspace`))

    const choice = await this.prompt(chalk.cyan(`\nSelect option (1-${workspaces.length + 2}): `))
    const choiceIndex = parseInt(choice, 10) - 1

    if (isNaN(choiceIndex) || choiceIndex < 0) {
      this.error(chalk.red('Invalid selection.'))
    }

    if (choiceIndex === workspaces.length) {
      // Add new workspace
      await this.addNewWorkspace()
    } else if (choiceIndex === workspaces.length + 1) {
      // Delete workspace
      await this.handleDeleteWorkspace()
    } else if (choiceIndex >= 0 && choiceIndex < workspaces.length) {
      // Switch to existing workspace
      setActiveWorkspace(choiceIndex)
      const workspace = workspaces[choiceIndex]!
      this.log(chalk.green(`✓ Switched to workspace: ${workspace.teamName} (${workspace.teamKey})`))
    } else {
      this.error(chalk.red('Invalid selection.'))
    }
  }

  private async handleNewWorkspace(): Promise<void> {
    const workspaces = getAllWorkspaces()

    if (workspaces.length > 0) {
      const addAnother = await this.prompt(
        chalk.yellow(`You have ${workspaces.length} workspace(s) saved. Add another? (y/N): `),
      )
      if (addAnother.toLowerCase() !== 'y' && addAnother.toLowerCase() !== 'yes') {
        this.log(chalk.green('Login cancelled.'))
        return
      }
    }

    await this.addNewWorkspace()
  }

  private async addNewWorkspace(): Promise<void> {
    // Prompt for API key
    this.log(chalk.blue('\nPlease enter your Linear API key.'))
    this.log(
      chalk.gray(
        "You can create one at: https://linear.app/settings/api. (Ensure you're in the right Linear workspace.)",
      ),
    )
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

      this.log(chalk.green('✓ API key validated.'))

      // Select team
      const selectedTeam = await this.selectTeam(client)
      if (!selectedTeam) {
        this.error(chalk.red('No team selected. Cannot create workspace.'))
      }

      // Create workspace
      const workspace: Workspace = {
        apiKey: apiKey.trim(),
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        teamKey: selectedTeam.key,
      }

      addWorkspace(workspace)
      const workspaces = getAllWorkspaces()
      setActiveWorkspace(workspaces.length - 1)

      this.log(chalk.green(`✓ Workspace "${workspace.teamName} (${workspace.teamKey})" added and set as active.`))
      this.log(chalk.green('\nLogin successful! You can now run `todo-purge run` to process TODOs.'))
    } catch (error) {
      this.error(chalk.red(`Failed to validate API key: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  private async handleDeleteWorkspace(): Promise<void> {
    const workspaces = getAllWorkspaces()

    if (workspaces.length === 0) {
      this.log(chalk.yellow('No workspaces to delete.'))
      return
    }

    if (workspaces.length === 1) {
      this.log(chalk.yellow('Cannot delete the last workspace. Please add another workspace first.'))
      return
    }

    const config = readConfig()
    const activeIndex = config.activeWorkspaceIndex ?? 0

    // Show workspaces for deletion
    this.log(chalk.blue('\nSelect workspace to delete:'))
    workspaces.forEach((workspace, index) => {
      const activeMarker = index === activeIndex ? chalk.red(' (active - will switch to another)') : ''
      this.log(chalk.cyan(`  ${index + 1}. ${workspace.teamName} (${workspace.teamKey})${activeMarker}`))
    })

    const choice = await this.prompt(chalk.cyan(`\nSelect workspace to delete (1-${workspaces.length}): `))
    const choiceIndex = parseInt(choice, 10) - 1

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= workspaces.length) {
      this.error(chalk.red('Invalid selection.'))
    }

    const workspaceToDelete = workspaces[choiceIndex]!

    // Confirm deletion
    const confirm = await this.prompt(
      chalk.yellow(
        `\nAre you sure you want to delete workspace "${workspaceToDelete.teamName} (${workspaceToDelete.teamKey})"? (y/N): `,
      ),
    )

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      this.log(chalk.green('Deletion cancelled.'))
      return
    }

    try {
      removeWorkspace(choiceIndex)
      this.log(chalk.green(`✓ Deleted workspace: ${workspaceToDelete.teamName} (${workspaceToDelete.teamKey})`))

      // Show new active workspace if one exists
      const remainingWorkspaces = getAllWorkspaces()
      if (remainingWorkspaces.length > 0) {
        const newConfig = readConfig()
        const newActiveIndex = newConfig.activeWorkspaceIndex ?? 0
        if (newActiveIndex >= 0 && newActiveIndex < remainingWorkspaces.length) {
          const newActive = remainingWorkspaces[newActiveIndex]!
          this.log(chalk.green(`✓ Active workspace: ${newActive.teamName} (${newActive.teamKey})`))
        }
      }
    } catch (error) {
      this.error(chalk.red(`Failed to delete workspace: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  private async selectTeam(client: LinearClient): Promise<{id: string; name: string; key: string} | null> {
    // Get teams and prompt for team selection
    const teams = await client.getTeams()
    if (teams.length === 0) {
      this.warn(chalk.yellow('No teams found. You may need to select a team later.'))
      return null
    }

    // Prompt for team selection
    this.log(chalk.blue('\nAvailable teams:'))
    teams.forEach((team, index) => {
      this.log(chalk.cyan(`  ${index + 1}. ${team.name} (${team.key})`))
    })

    const teamChoice = await this.prompt(chalk.cyan(`\nSelect a team (1-${teams.length}): `))
    const teamIndex = parseInt(teamChoice, 10) - 1

    if (isNaN(teamIndex) || teamIndex < 0 || teamIndex >= teams.length) {
      this.warn(chalk.yellow('Invalid team selection.'))
      return null
    }

    return teams[teamIndex]!
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
        setAIEnabled(true) // Enable AI by default when key is added
        this.log(chalk.green('✓ OpenAI API key validated and stored.'))

        // Show first-time warning if not seen before
        if (!hasSeenAIWarning()) {
          this.log(chalk.yellow('\nNote: Using AI will consume API credits. You can disable it with `todo-purge config` or the --no-ai flag.'))
          setAIWarningSeen()
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
      setAIEnabled(true) // Enable AI by default when key is added
      this.log(chalk.green('✓ OpenAI API key validated and stored.'))

      // Show first-time warning if not seen before
      if (!hasSeenAIWarning()) {
        this.log(chalk.yellow('\nNote: Using AI will consume API credits. You can disable it with `todo-purge config` or the --no-ai flag.'))
        setAIWarningSeen()
      }
    } catch (error) {
      this.error(
        chalk.red(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : String(error)}`),
      )
    }
  }

  private async handleGeminiKey(providedKey?: string): Promise<void> {
    // if (providedKey) {
    //   if (!providedKey.trim()) {
    //     this.error(chalk.red('OpenAI API key cannot be empty.'))
    //   }

    //   this.log(chalk.blue('Validating OpenAI API key...'))
    //   const openAIClient = new OpenAIClient(providedKey.trim())

    //   try {
    //     const isValid = await openAIClient.validateApiKey()
    //     if (!isValid) {
    //       this.error(chalk.red('Invalid OpenAI API key. Please check your API key and try again.'))
    //     }

    //     setOpenAIApiKey(providedKey.trim())
    //     setAIEnabled(true) // Enable AI by default when key is added
    //     this.log(chalk.green('✓ OpenAI API key validated and stored.'))

    //     // Show first-time warning if not seen before
    //     if (!hasSeenAIWarning()) {
    //       this.log(chalk.yellow('\nNote: Using OpenAI will consume API credits. You can disable it with `todo-purge config` or the --no-ai flag.'))
    //       setOpenAIWarningSeen()
    //     }
    //   } catch (error) {
    //     this.error(
    //       chalk.red(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : String(error)}`),
    //     )
    //   }

    //   return
    // }

    // // If key already exists, don't prompt
    // if (hasOpenAIApiKey()) {
    //   return
    // }

    // // Otherwise, optionally prompt for it
    // const addOpenAI = await this.prompt(
    //   chalk.yellow('\nWould you like to add an OpenAI API key for enhanced descriptions? (y/N): '),
    // )

    // if (addOpenAI.toLowerCase() !== 'y' && addOpenAI.toLowerCase() !== 'yes') {
    //   return
    // }

    // this.log(chalk.blue('Please enter your OpenAI API key.'))
    // this.log(chalk.gray('You can create one at: https://platform.openai.com/api-keys'))
    // const openAIKey = await this.prompt(chalk.cyan('OpenAI API Key: '))

    // if (!openAIKey || !openAIKey.trim()) {
    //   this.error(chalk.red('OpenAI API key cannot be empty.'))
    // }

    // this.log(chalk.blue('Validating OpenAI API key...'))
    // const openAIClient = new OpenAIClient(openAIKey.trim())

    // try {
    //   const isValid = await openAIClient.validateApiKey()
    //   if (!isValid) {
    //     this.error(chalk.red('Invalid OpenAI API key. Please check your API key and try again.'))
    //   }

    //   setOpenAIApiKey(openAIKey.trim())
    //   setAIEnabled(true) // Enable AI by default when key is added
    //   this.log(chalk.green('✓ OpenAI API key validated and stored.'))

    //   // Show first-time warning if not seen before
    //   if (!hasSeenAIWarning()) {
    //     this.log(chalk.yellow('\nNote: Using OpenAI will consume API credits. You can disable it with `todo-purge config` or the --no-ai flag.'))
    //     setOpenAIWarningSeen()
    //   }
    // } catch (error) {
    //   this.error(
    //     chalk.red(`Failed to validate OpenAI API key: ${error instanceof Error ? error.message : String(error)}`),
    //   )
    // }
  }
}
