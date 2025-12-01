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
  geminiApiKey?: string
  hasSeenAIWarning?: boolean
  aiEnabled?: boolean
  aiContextModel?: string
  aiDescriptionModel?: string
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
    return config
  } catch (error) {
    // Config file doesn't exist or is invalid
    return {}
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

export function getGeminiApiKey(): string | undefined {
  const config = readConfig()
  return config.geminiApiKey
}

export function setGeminiApiKey(geminiApiKey: string): void {
  const config = readConfig()
  config.geminiApiKey = geminiApiKey
  writeConfig(config)
}

export function hasGeminiApiKey(): boolean {
  const geminiApiKey = getGeminiApiKey()
  return Boolean(geminiApiKey && geminiApiKey.trim().length > 0)
}

export function hasSeenAIWarning(): boolean {
  const config = readConfig()
  return Boolean(config.hasSeenAIWarning)
}

export function setAIWarningSeen(): void {
  const config = readConfig()
  config.hasSeenAIWarning = true
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
