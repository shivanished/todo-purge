import {Command, Args, Flags} from '@oclif/core'
import {createInterface} from 'node:readline'
import {
  getAllWorkspaces,
  setActiveWorkspace,
  getActiveWorkspace,
  readConfig,
  setAIEnabled,
  getAIEnabled,
  setAIContextModel,
  getAIContextModel,
  setAIDescriptionModel,
  getAIDescriptionModel,
  hasOpenAIApiKey,
} from '../lib/config.js'
import chalk from 'chalk'

export default class Config extends Command {
  static override description = 'Configure todo-purge settings (AI, models, workspace)'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> set ai.enabled false',
    '<%= config.bin %> <%= command.id %> get ai.context-model',
  ]

  static override flags = {}

  static override args = {
    subcommand: Args.string({
      description: 'Subcommand: set or get',
      required: false,
    }),
    key: Args.string({
      description: 'Config key (for set/get)',
      required: false,
    }),
    value: Args.string({
      description: 'Config value (for set)',
      required: false,
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
    const {args} = await this.parse(Config)

    // Handle subcommands
    if (args.subcommand === 'set') {
      await this.handleSet(args.key, args.value)
      return
    }

    if (args.subcommand === 'get') {
      await this.handleGet(args.key)
      return
    }

    // Interactive menu if no subcommand
    await this.showInteractiveMenu()
  }

  private async showInteractiveMenu(): Promise<void> {
    const config = readConfig()
    const aiEnabled = getAIEnabled()
    const contextModel = getAIContextModel()
    const descriptionModel = getAIDescriptionModel()
    const activeWorkspace = getActiveWorkspace()

    this.log(chalk.blue('\n=== todo-purge Configuration ===\n'))

    // Show current settings
    this.log(chalk.cyan('Current Settings:'))
    this.log(`  AI Enabled: ${aiEnabled ? chalk.green('Yes') : chalk.red('No')}`)
    this.log(`  Context Model: ${chalk.yellow(contextModel)}`)
    this.log(`  Description Model: ${chalk.yellow(descriptionModel)}`)
    if (activeWorkspace) {
      this.log(`  Active Workspace: ${chalk.green(activeWorkspace.teamName)} (${activeWorkspace.teamKey})`)
    } else {
      this.log(`  Active Workspace: ${chalk.red('None')}`)
    }

    this.log(chalk.blue('\nOptions:'))
    this.log(chalk.cyan('  1. Toggle AI on/off'))
    this.log(chalk.cyan('  2. Set context model'))
    this.log(chalk.cyan('  3. Set description model'))
    this.log(chalk.cyan('  4. Switch active workspace'))
    this.log(chalk.cyan('  5. Exit'))

    const choice = await this.prompt(chalk.cyan('\nSelect option (1-5): '))

    switch (choice.trim()) {
      case '1':
        await this.handleToggleAI()
        break
      case '2':
        await this.handleSetContextModel()
        break
      case '3':
        await this.handleSetDescriptionModel()
        break
      case '4':
        await this.handleSwitchWorkspace()
        break
      case '5':
        this.log(chalk.green('Exiting...'))
        return
      default:
        this.error(chalk.red('Invalid selection.'))
    }

    // Show menu again after action
    await this.showInteractiveMenu()
  }

  private async handleToggleAI(): Promise<void> {
    const current = getAIEnabled()
    const newValue = !current

    if (!hasOpenAIApiKey() && newValue) {
      this.log(chalk.yellow('Warning: No OpenAI API key configured. Add one with `todo-purge login` first.'))
      const confirm = await this.prompt(chalk.yellow('Continue anyway? (y/N): '))
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        return
      }
    }

    setAIEnabled(newValue)
    this.log(
      chalk.green(`✓ AI ${newValue ? 'enabled' : 'disabled'}. ${newValue ? 'AI features will be used when running todo-purge.' : 'AI features will be skipped.'}`),
    )
  }

  private async handleSetContextModel(): Promise<void> {
    const current = getAIContextModel()
    this.log(chalk.blue(`Current context model: ${chalk.yellow(current)}`))
    const newModel = await this.prompt(chalk.cyan('Enter new context model (or press Enter to keep current): '))

    if (newModel.trim()) {
      setAIContextModel(newModel.trim())
      this.log(chalk.green(`✓ Context model set to: ${newModel.trim()}`))
    } else {
      this.log(chalk.gray('Keeping current model.'))
    }
  }

  private async handleSetDescriptionModel(): Promise<void> {
    const current = getAIDescriptionModel()
    this.log(chalk.blue(`Current description model: ${chalk.yellow(current)}`))
    const newModel = await this.prompt(chalk.cyan('Enter new description model (or press Enter to keep current): '))

    if (newModel.trim()) {
      setAIDescriptionModel(newModel.trim())
      this.log(chalk.green(`✓ Description model set to: ${newModel.trim()}`))
    } else {
      this.log(chalk.gray('Keeping current model.'))
    }
  }

  private async handleSwitchWorkspace(): Promise<void> {
    const workspaces = getAllWorkspaces()

    if (workspaces.length === 0) {
      this.log(chalk.yellow('No workspaces found. Add one with `todo-purge login`.'))
      return
    }

    const config = readConfig()
    const activeIndex = config.activeWorkspaceIndex ?? 0

    this.log(chalk.blue('\nAvailable workspaces:'))
    workspaces.forEach((workspace, index) => {
      const activeMarker = index === activeIndex ? chalk.green(' (active)') : ''
      this.log(chalk.cyan(`  ${index + 1}. ${workspace.teamName} (${workspace.teamKey})${activeMarker}`))
    })

    const choice = await this.prompt(chalk.cyan(`\nSelect workspace (1-${workspaces.length}): `))
    const choiceIndex = parseInt(choice, 10) - 1

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= workspaces.length) {
      this.error(chalk.red('Invalid selection.'))
    }

    setActiveWorkspace(choiceIndex)
    const workspace = workspaces[choiceIndex]!
    this.log(chalk.green(`✓ Switched to workspace: ${workspace.teamName} (${workspace.teamKey})`))
  }

  private async handleSet(key?: string, value?: string): Promise<void> {
    if (!key) {
      this.error(chalk.red('Key is required for set command. Usage: todo-purge config set <key> <value>'))
    }

    if (value === undefined) {
      this.error(chalk.red('Value is required for set command. Usage: todo-purge config set <key> <value>'))
    }

    switch (key) {
      case 'ai.enabled':
        const boolValue = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
        setAIEnabled(boolValue)
        this.log(chalk.green(`✓ Set ai.enabled to ${boolValue}`))
        break
      case 'ai.context-model':
        setAIContextModel(value)
        this.log(chalk.green(`✓ Set ai.context-model to ${value}`))
        break
      case 'ai.description-model':
        setAIDescriptionModel(value)
        this.log(chalk.green(`✓ Set ai.description-model to ${value}`))
        break
      case 'workspace.active':
        const workspaces = getAllWorkspaces()
        if (workspaces.length === 0) {
          this.error(chalk.red('No workspaces found. Add one with `todo-purge login`.'))
        }
        // Try to parse as index first
        const index = parseInt(value, 10)
        if (!isNaN(index) && index >= 1 && index <= workspaces.length) {
          setActiveWorkspace(index - 1)
          const workspace = workspaces[index - 1]!
          this.log(chalk.green(`✓ Switched to workspace: ${workspace.teamName} (${workspace.teamKey})`))
        } else {
          // Try to find by name
          const foundIndex = workspaces.findIndex(
            (w) => w.teamName.toLowerCase() === value.toLowerCase() || w.teamKey.toLowerCase() === value.toLowerCase(),
          )
          if (foundIndex >= 0) {
            setActiveWorkspace(foundIndex)
            const workspace = workspaces[foundIndex]!
            this.log(chalk.green(`✓ Switched to workspace: ${workspace.teamName} (${workspace.teamKey})`))
          } else {
            this.error(chalk.red(`Workspace "${value}" not found. Use a number (1-${workspaces.length}) or workspace name/key.`))
          }
        }
        break
      default:
        this.error(chalk.red(`Unknown config key: ${key}. Available keys: ai.enabled, ai.context-model, ai.description-model, workspace.active`))
    }
  }

  private async handleGet(key?: string): Promise<void> {
    if (!key) {
      this.error(chalk.red('Key is required for get command. Usage: todo-purge config get <key>'))
    }

    switch (key) {
      case 'ai.enabled':
        this.log(String(getAIEnabled()))
        break
      case 'ai.context-model':
        this.log(getAIContextModel())
        break
      case 'ai.description-model':
        this.log(getAIDescriptionModel())
        break
      case 'workspace.active':
        const activeWorkspace = getActiveWorkspace()
        if (activeWorkspace) {
          const workspaces = getAllWorkspaces()
          const config = readConfig()
          const activeIndex = config.activeWorkspaceIndex ?? 0
          this.log(`${activeIndex + 1}`)
        } else {
          this.log('none')
        }
        break
      default:
        this.error(chalk.red(`Unknown config key: ${key}. Available keys: ai.enabled, ai.context-model, ai.description-model, workspace.active`))
    }
  }
}

