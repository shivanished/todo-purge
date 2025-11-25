import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'

export interface Config {
  linearApiKey?: string
  openAIApiKey?: string
  teamId?: string
}

const CONFIG_DIR = join(homedir(), '.todo-purge')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export function getConfigPath(): string {
  return CONFIG_FILE
}

export function readConfig(): Config {
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as Config
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

export function getLinearApiKey(): string | undefined {
  const config = readConfig()
  return config.linearApiKey
}

export function setLinearApiKey(apiKey: string): void {
  const config = readConfig()
  config.linearApiKey = apiKey
  writeConfig(config)
}

export function hasLinearApiKey(): boolean {
  const linearApiKey = getLinearApiKey()
  return Boolean(linearApiKey && linearApiKey.trim().length > 0)
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
  const config = readConfig()
  return config.teamId
}

export function setTeamId(teamId: string): void {
  const config = readConfig()
  config.teamId = teamId
  writeConfig(config)
}

