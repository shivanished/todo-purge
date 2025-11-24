import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'

export interface Config {
  apiKey?: string
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

export function getApiKey(): string | undefined {
  const config = readConfig()
  return config.apiKey
}

export function setApiKey(apiKey: string): void {
  const config = readConfig()
  config.apiKey = apiKey
  writeConfig(config)
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

export function hasApiKey(): boolean {
  const apiKey = getApiKey()
  return Boolean(apiKey && apiKey.trim().length > 0)
}

