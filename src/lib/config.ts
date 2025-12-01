import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'

export interface Workspace {
  apiKey: string
  teamId: string
  teamName: string
  teamKey: string
}

export interface Config {
  workspaces?: Workspace[]
  activeWorkspaceIndex?: number // 0-based index
  openAIApiKey?: string
  hasSeenOpenAIWarning?: boolean
  aiEnabled?: boolean
  aiContextModel?: string
  aiDescriptionModel?: string
  // Legacy fields (for migration)
  linearApiKey?: string
  teamId?: string
  teamIds?: string[]
  activeTeamId?: number
}

const CONFIG_DIR = join(homedir(), '.todo-purge')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export function getConfigPath(): string {
  return CONFIG_FILE
}

export function readConfig(): Config {
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    const config = JSON.parse(content) as Config
    // Migrate old config format to new format if needed
    migrateConfigIfNeeded(config)
    return config
  } catch (error) {
    // Config file doesn't exist or is invalid
    return {}
  }
}

function migrateConfigIfNeeded(config: Config): void {
  // If already migrated (has workspaces), skip migration
  if (config.workspaces && config.workspaces.length > 0) {
    return
  }

  // If old format exists, migrate it
  if (config.linearApiKey && config.teamId) {
    // We need team name and key, but they might not be in old config
    // We'll use placeholder values and let the user re-login if needed
    const workspace: Workspace = {
      apiKey: config.linearApiKey,
      teamId: config.teamId,
      teamName: 'Unknown Team', // Will be updated on next login
      teamKey: 'UNK', // Will be updated on next login
    }

    config.workspaces = [workspace]
    config.activeWorkspaceIndex = 0

    // Clean up old fields
    delete config.linearApiKey
    delete config.teamId
    delete config.teamIds
    delete config.activeTeamId

    // Write migrated config
    writeConfig(config)
  }
}

export function writeConfig(config: Config): void {
  try {
    // Create directory if it doesn't exist
    mkdirSync(CONFIG_DIR, {recursive: true})
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    throw new Error(`Failed to write config file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function getActiveWorkspace(): Workspace | undefined {
  const config = readConfig()
  if (!config.workspaces || config.workspaces.length === 0) {
    return undefined
  }
  const activeIndex = config.activeWorkspaceIndex ?? 0
  if (activeIndex < 0 || activeIndex >= config.workspaces.length) {
    return undefined
  }
  return config.workspaces[activeIndex]
}

export function getAllWorkspaces(): Workspace[] {
  const config = readConfig()
  return config.workspaces ?? []
}

export function addWorkspace(workspace: Workspace): void {
  const config = readConfig()
  if (!config.workspaces) {
    config.workspaces = []
  }
  config.workspaces.push(workspace)
  writeConfig(config)
}

export function setActiveWorkspace(index: number): void {
  const config = readConfig()
  if (!config.workspaces || index < 0 || index >= config.workspaces.length) {
    throw new Error(`Invalid workspace index: ${index}`)
  }
  config.activeWorkspaceIndex = index
  writeConfig(config)
}

export function removeWorkspace(index: number): void {
  const config = readConfig()
  if (!config.workspaces || index < 0 || index >= config.workspaces.length) {
    throw new Error(`Invalid workspace index: ${index}`)
  }
  config.workspaces.splice(index, 1)
  // Adjust active index if needed
  if (config.activeWorkspaceIndex !== undefined) {
    if (config.activeWorkspaceIndex >= config.workspaces.length) {
      config.activeWorkspaceIndex = Math.max(0, config.workspaces.length - 1)
    } else if (config.activeWorkspaceIndex > index) {
      config.activeWorkspaceIndex -= 1
    }
  }
  writeConfig(config)
}

export function getLinearApiKey(): string | undefined {
  const workspace = getActiveWorkspace()
  return workspace?.apiKey
}

export function setLinearApiKey(apiKey: string): void {
  // Legacy function - for backward compatibility, update active workspace
  const config = readConfig()
  if (config.workspaces && config.workspaces.length > 0) {
    const activeIndex = config.activeWorkspaceIndex ?? 0
    if (activeIndex >= 0 && activeIndex < config.workspaces.length) {
      config.workspaces[activeIndex]!.apiKey = apiKey
      writeConfig(config)
      return
    }
  }
  // If no workspace exists, create one (legacy behavior)
  const newWorkspace: Workspace = {
    apiKey,
    teamId: '',
    teamName: 'Unknown Team',
    teamKey: 'UNK',
  }
  addWorkspace(newWorkspace)
  setActiveWorkspace(0)
}

export function hasLinearApiKey(): boolean {
  const workspace = getActiveWorkspace()
  return Boolean(workspace?.apiKey && workspace.apiKey.trim().length > 0)
}

export function getOpenAIApiKey(): string | undefined {
  const config = readConfig()
  return config.openAIApiKey
}

export function setOpenAIApiKey(openAIApiKey: string): void {
  const config = readConfig()
  config.openAIApiKey = openAIApiKey
  writeConfig(config)
}

export function hasOpenAIApiKey(): boolean {
  const openAIApiKey = getOpenAIApiKey()
  return Boolean(openAIApiKey && openAIApiKey.trim().length > 0)
}

export function getTeamId(): string | undefined {
  const workspace = getActiveWorkspace()
  return workspace?.teamId
}

export function setTeamId(teamId: string): void {
  // Legacy function
  const config = readConfig()
  if (config.workspaces && config.workspaces.length > 0) {
    const activeIndex = config.activeWorkspaceIndex ?? 0
    if (activeIndex >= 0 && activeIndex < config.workspaces.length) {
      config.workspaces[activeIndex]!.teamId = teamId
      writeConfig(config)
    }
  }
}

export function hasSeenOpenAIWarning(): boolean {
  const config = readConfig()
  return Boolean(config.hasSeenOpenAIWarning)
}

export function setOpenAIWarningSeen(): void {
  const config = readConfig()
  config.hasSeenOpenAIWarning = true
  writeConfig(config)
}

export function getAIEnabled(): boolean {
  const config = readConfig()
  if (config.aiEnabled !== undefined) {
    return config.aiEnabled
  }
  // Default: true if OpenAI key exists, false otherwise
  return hasOpenAIApiKey()
}

export function setAIEnabled(enabled: boolean): void {
  const config = readConfig()
  config.aiEnabled = enabled
  writeConfig(config)
}

export function getAIContextModel(): string {
  const config = readConfig()
  return config.aiContextModel ?? 'gpt-4.1-nano'
}

export function setAIContextModel(model: string): void {
  const config = readConfig()
  config.aiContextModel = model
  writeConfig(config)
}

export function getAIDescriptionModel(): string {
  const config = readConfig()
  return config.aiDescriptionModel ?? 'gpt-4.1-nano'
}

export function setAIDescriptionModel(model: string): void {
  const config = readConfig()
  config.aiDescriptionModel = model
  writeConfig(config)
}
