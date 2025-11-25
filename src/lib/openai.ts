import OpenAI from 'openai'

export class OpenAIClient {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    })
  }

  async generateDescription(
    todoDescription: string,
    filePath: string,
    lineNumber: number,
    codeContext: string,
    fullFileContent: string,
  ): Promise<string> {
    const prompt = `
        You are a software engineer writing a ticket description for a TODO comment found in code.

        TODO Description: ${todoDescription}

        File: ${filePath}
        Line: ${lineNumber}

        Full File Content:
        \`\`\`
        ${fullFileContent}
        \`\`\`

        Code Context (for reference - this is what will be included in the ticket):
        \`\`\`
        ${codeContext}
        \`\`\`

        Generate a clear, concise, and professional description for this TODO ticket. The description should:
        1. Explain what needs to be done based on the TODO comment
        2. Provide context about why this might be needed based on the full file content
        3. Be written in a professional tone suitable for a project management ticket
        4. Be 2-4 sentences long

        Use the full file content to understand the broader context, including imports, class/function definitions, and overall file structure. This will help you create a more accurate and helpful description.

        Return only the description text, without any markdown formatting or additional commentary.
`

    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        })

        const description = response.choices[0]?.message?.content?.trim()
        if (!description) {
          throw new Error('OpenAI API returned empty response')
        }

        return description
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        const isTimeout =
          lastError.message.includes('timeout') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('ECONNRESET') ||
          (lastError as any).code === 'ETIMEDOUT' ||
          (lastError as any).code === 'ECONNRESET'

        if (isTimeout && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        throw new Error(`OpenAI API error: ${lastError.message}`)
      }
    }
    throw new Error(`OpenAI API error: ${lastError?.message ?? 'Unknown error'}`)
  }

  // TODO: check out this function to ensure it's working
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-5-nano-2025-08-07',
        messages: [{role: 'user', content: 'test'}],
        max_tokens: 5,
      })
      return true
    } catch {
      return false
    }
  }
}
