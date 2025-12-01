import OpenAI from 'openai'

export class OpenAIClient {
  private client: OpenAI
  private contextModel: string
  private descriptionModel: string

  constructor(apiKey: string, contextModel?: string, descriptionModel?: string) {
    this.client = new OpenAI({
      apiKey,
    })
    this.contextModel = contextModel ?? 'gpt-4.1-nano'
    this.descriptionModel = descriptionModel ?? 'gpt-4.1-nano'
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
          model: this.descriptionModel,
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

  async generateContext(
    todoDescription: string,
    filePath: string,
    lineNumber: number,
    fullFileContent: string,
  ): Promise<string> {
    const lines = fullFileContent.split('\n')
    const todoLine = lines[lineNumber - 1] || ''

    // Create a numbered version of the file for context
    const numberedLines = lines.map((line, index) => `${(index + 1).toString().padStart(4, ' ')} | ${line}`).join('\n')

    const prompt = `
You are a software engineer analyzing code to determine the most relevant context for a TODO comment.

TODO Description: ${todoDescription}
File: ${filePath}
TODO Line Number: ${lineNumber}
TODO Line: ${todoLine}

Full File Content (with line numbers):
\`\`\`
${numberedLines}
\`\`\`

Your task: Select the most relevant code context around the TODO comment (line ${lineNumber}). 

Guidelines:
1. Include the TODO line itself
2. Include relevant code above and below that helps understand what needs to be done
3. Focus on:
   - The function/class/method containing the TODO
   - Related variable declarations and imports
   - Related function calls or logic flow
   - Type definitions or interfaces if relevant
4. Keep it concise - aim for 10-30 lines total, but prioritize relevance over strict limits
5. Do NOT include unrelated code from other functions/classes unless directly relevant
6. Maintain the exact format with line numbers: "    X | code line"

Return ONLY the selected context lines in the exact format shown above (with line numbers and pipe separator), nothing else. Do not include markdown code blocks or any other text.
`

    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.contextModel,
          messages: [{role: 'user', content: prompt}],
          temperature: 0.3,
          max_tokens: 2000,
        })

        const context = response.choices[0]?.message?.content?.trim() ?? ''
        if (!context) {
          throw new Error('OpenAI API returned empty context')
        }

        // Clean up any markdown code blocks if the model added them
        return context
          .replace(/^```[\w]*\n?/gm, '')
          .replace(/\n?```$/gm, '')
          .trim()
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

  async validateApiKey(): Promise<boolean> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [{role: 'user', content: 'test'}],
        max_tokens: 5,
      })
      return true
    } catch {
      return false
    }
  }
}
