import {GraphQLClient} from 'graphql-request'
import {gql} from 'graphql-request'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearIssue {
  id: string
  identifier: string
  title: string
  url: string
}

export class LinearClient {
  private client: GraphQLClient

  constructor(apiKey: string) {
    this.client = new GraphQLClient(LINEAR_API_URL, {
      headers: {
        Authorization: `${apiKey}`,
      },
    })
  }

  async getTeams(): Promise<LinearTeam[]> {
    const query = gql`
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `
    try {
      const data = await this.client.request<{teams: {nodes: LinearTeam[]}}>(query)
      return data.teams.nodes
    } catch (error) {
      throw new Error(`Failed to fetch teams: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async createIssue(teamId: string, title: string, description: string): Promise<LinearIssue> {
    const mutation = gql`
      mutation IssueCreate($teamId: String!, $title: String!, $description: String!) {
        issueCreate(input: {teamId: $teamId, title: $title, description: $description}) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `

    try {
      const data = await this.client.request<{
        issueCreate: {
          success: boolean
          issue: LinearIssue & {url: string}
        }
      }>(mutation, {
        teamId,
        title,
        description,
      })

      if (!data.issueCreate.success || !data.issueCreate.issue) {
        throw new Error('Failed to create issue: API returned unsuccessful response')
      }

      return data.issueCreate.issue
    } catch (error) {
      throw new Error(`Failed to create Linear issue: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.getTeams()
      return true
    } catch {
      return false
    }
  }
}
