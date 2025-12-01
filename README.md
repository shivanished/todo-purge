# todo-purge

A CLI tool that automatically finds TODO and FIXME comments in your codebase, creates Linear tickets for them, and optionally removes the comments from your code.

## Features

- 🔍 **Automatic scanning** - Finds all TODO/FIXME comments across your codebase
- 🎫 **Linear integration** - Creates tickets in your Linear workspace automatically
- 🤖 **AI-powered context** - Uses OpenAI to intelligently select relevant code context and generate ticket descriptions
- 👥 **Multi-workspace support** - Manage multiple Linear workspaces and switch between them
- 🧹 **Clean code** - Optionally removes TODO comments after creating tickets

## Installation

```bash
npm install -g todo-purge
```

## Quick Start

### 1. Login and Setup

First, authenticate with Linear and optionally add your OpenAI API key:

```bash
todo-purge login
```

This will:

- Prompt you for your Linear API key (create one at Settings > Security & Access > Personal API Keys, or visit [linear.app/settings/api](https://linear.app/settings/api))
  - **Important:** Linear API keys are workspace-specific. Each workspace requires its own API key.
- Validate the API key
- Let you select which team/workspace to use (the API key determines which workspace you can access)
- Optionally prompt you to add an OpenAI API key for AI features

**Adding OpenAI key during login:**

```bash
todo-purge login --openai-key=sk-your-key-here
```

### 2. Run the Tool

Scan your codebase and create tickets:

```bash
todo-purge run
```

This will:

- Scan your codebase for TODO/FIXME comments
- Create Linear tickets for each one
- Remove the comments from your code (unless you use `--keep-comments`)

## AI Features

### When is AI Used?

AI is automatically used when:

- ✅ You have an OpenAI API key configured (added during `login`)
- ✅ You haven't disabled it with the `--no-ai` flag

### What Does AI Do?

When AI is enabled, it provides two enhancements:

1. **Smart Code Context Selection** 🧠

   - Instead of using a fixed number of lines above/below the TODO, AI analyzes the entire file
   - Intelligently selects only the most relevant code context (function definitions, related variables, imports, etc.)
   - Keeps context concise and focused on what's actually needed

2. **Enhanced Ticket Descriptions** ✍️
   - Generates professional, clear descriptions for your tickets
   - Explains what needs to be done based on the TODO comment
   - Provides context about why it might be needed

### Enabling/Disabling AI

**Enable AI:**

```bash
# Add OpenAI key during login
todo-purge login --openai-key=sk-your-key-here

# Or add it later by running login again
todo-purge login
```

**Disable AI (temporarily):**

```bash
# Run without AI, even if you have a key configured
todo-purge run --no-ai
```

**Disable AI (permanently):**
Just don't add an OpenAI key, or remove it from your config file.

### AI Costs

- You'll see a warning if processing more than 10 TODOs at once
- AI is only used when enabled - no charges if you don't configure a key

### Supported Models

The following models are supported for AI features:

- `gpt-4.1`
- `gpt-4.1-nano`
- `gpt-5`
- `gpt-5-nano`
- `gpt-5-mini`
- `gpt-5-pro`
- `gpt-5.1`

You can configure which model to use for context selection and descriptions separately using the `config` command (see [`todo-purge config`](#todo-purge-config) below).

## Managing Multiple Workspaces

### Understanding Linear API Keys

**Important:** Linear API keys are workspace-specific, not account-wide. This means:

- Each Linear workspace requires its own API key
- If you have 3 workspaces (A, B, C), you need 3 separate API keys
- When you create an API key in Linear, it's scoped to that specific workspace
- The tool stores each workspace with its own API key

This is why the tool supports multiple workspaces - each workspace you add will have its own API key associated with it.

### Adding Multiple Workspaces

You can work with multiple Linear workspaces. Each workspace needs its own API key:

```bash
# Add your first workspace (workspace A)
todo-purge login
# Enter API key for workspace A

# Add another workspace (workspace B)
todo-purge login  # Choose "Add new workspace" when prompted
# Enter API key for workspace B

# Add workspace C
todo-purge login  # Choose "Add new workspace" when prompted
# Enter API key for workspace C
```

**To create a Linear API key for a workspace:**

1. Navigate to **Settings > Security & Access > Personal API Keys** in Linear (or visit [linear.app/settings/api](https://linear.app/settings/api))
2. Make sure you're in the correct workspace (check the workspace selector)
3. Create a new API key
4. Copy it and use it when adding that workspace to the tool

### Switching Between Workspaces

```bash
todo-purge login --switch-team
```

This will:

- Show all your saved workspaces
- Let you select which one to make active
- Allow you to add new workspaces
- Allow you to delete workspaces

### Active Workspace

- **Only one workspace is active at a time**
- When you run `todo-purge run`, it uses your **active workspace** and its associated API key
- The active workspace is shown with a green "(active)" marker when switching teams
- Your active workspace is validated before processing TODOs
- Each workspace stores its own API key, so switching workspaces automatically uses the correct key

## Command Reference

### `todo-purge login`

Authenticate with Linear and manage workspaces.

**Flags:**

- `--switch-team` - Switch to a different workspace or manage workspaces
- `--openai-key=<key>` - Add OpenAI API key during login

**Examples:**

```bash
# Initial login
todo-purge login

# Switch to a different team
todo-purge login --switch-team

# Add OpenAI key during login
todo-purge login --openai-key=sk-...
```

### `todo-purge run`

Scan codebase and create Linear tickets.

**Flags:**

- `--context-lines=<above,below>` - Number of lines to include when AI is disabled (default: `5,10`)
  - Format: `above,below` (e.g., `10,15` for 10 lines above, 15 below)
  - **Note:** This is ignored when AI is enabled (AI selects context intelligently)
- `--keep-comments` - Keep TODO comments in files instead of removing them
- `--no-ai` - Disable AI features even if OpenAI key is configured

**Examples:**

```bash
# Basic usage
todo-purge run

# Keep comments in code (don't remove them)
todo-purge run --keep-comments

# Disable AI for this run
todo-purge run --no-ai

# Custom context lines (only used when AI is disabled)
todo-purge run --context-lines=10,20

# Combine flags
todo-purge run --keep-comments --no-ai
```

### `todo-purge config`

Configure todo-purge settings including AI models and workspace management.

**Interactive mode:**

```bash
todo-purge config
```

**Set a configuration value:**

```bash
todo-purge config set <key> <value>
```

**Get a configuration value:**

```bash
todo-purge config get <key>
```

**Available configuration keys:**

- `ai.enabled` - Enable/disable AI features (true/false)
- `ai.context-model` - Model to use for context selection (see [Supported Models](#supported-models))
- `ai.description-model` - Model to use for description generation (see [Supported Models](#supported-models))
- `workspace.active` - Switch active workspace (number or workspace name/key)

**Examples:**

```bash
# Interactive configuration menu
todo-purge config

# Set context model
todo-purge config set ai.context-model gpt-5-mini

# Set description model
todo-purge config set ai.description-model gpt-5

# Enable AI
todo-purge config set ai.enabled true

# Get current context model
todo-purge config get ai.context-model
```

**Note:** Only the models listed in [Supported Models](#supported-models) are accepted. Invalid models will be rejected.

## How It Works

1. **Scanning** - Recursively scans your codebase for TODO/FIXME comments

   - Excludes common directories: `node_modules`, `.git`, `dist`, `build`, etc.
   - Supports many file types: TypeScript, JavaScript, Python, Java, Go, Rust, and more

2. **Context Extraction** (if AI enabled):

   - AI analyzes the full file
   - Selects relevant code context intelligently
   - Focuses on function/class definitions, related variables, and logic flow

3. **Context Extraction** (if AI disabled):

   - Uses fixed number of lines above/below the TODO
   - Configurable via `--context-lines` flag

4. **Ticket Creation**:

   - Creates a Linear ticket with the TODO description as the title
   - Includes file location and code context
   - Optionally generates AI-enhanced description

5. **Cleanup** (optional):
   - Removes the TODO comment from your code
   - Preserves any code on the same line before the comment

## Workflow Examples

### First Time Setup

```bash
# 1. Login and add workspace
todo-purge login

# 2. (Optional) Add OpenAI key for AI features
todo-purge login --openai-key=sk-...

# 3. Run the tool
todo-purge run
```

### Working with Multiple Workspaces

```bash
# Add workspace A (with its API key)
todo-purge login
# Enter API key for workspace A, select team

# Add workspace B (with its API key)
todo-purge login
# Choose "Add new workspace", enter API key for workspace B, select team

# Switch to workspace A
todo-purge login --switch-team
# Select workspace A

# Process TODOs for workspace A (uses workspace A's API key)
todo-purge run

# Switch to workspace B
todo-purge login --switch-team
# Select workspace B

# Process TODOs for workspace B (uses workspace B's API key)
todo-purge run
```

### Testing Without Creating Tickets

```bash
# Keep comments so you can review what would be created
todo-purge run --keep-comments
```

### Using Without AI

```bash
# Disable AI for this run
todo-purge run --no-ai

# Or just don't configure an OpenAI key
```

## Troubleshooting

**"No active workspace found"**

- Run `todo-purge login` to add a workspace

**"API key is invalid"**

- Your Linear API key may have expired or been revoked
- The API key might be for a different workspace than expected
- Run `todo-purge login --switch-team` to update the API key for that workspace

**"Team is not accessible"**

- The API key you're using might be for a different workspace
- You may have lost access to the team, or the team ID changed
- Run `todo-purge login --switch-team` to reconfigure or update the API key

**AI not working?**

- Check that you added an OpenAI API key: run `todo-purge login` again
- Make sure you're not using `--no-ai` flag
- Verify your OpenAI API key is valid and has credits

## Requirements

- Node.js >= 18.0.0
- A Linear account with API access
  - **Note:** You'll need a separate API key for each Linear workspace you want to use
  - Create API keys at **Settings > Security & Access > Personal API Keys** in Linear (or visit [linear.app/settings/api](https://linear.app/settings/api)) - make sure you're in the correct workspace
- (Optional) OpenAI API key for AI features (one key works for all workspaces)

## License

MIT
