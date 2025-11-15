# .github/workflows/onPushToMain.yml

```yml
# test
name: version, tag and github release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Check if version already exists
        id: version-check
        run: |
          package_version=$(node -p "require('./package.json').version")
          exists=$(gh api repos/${{ github.repository }}/releases/tags/v$package_version >/dev/null 2>&1 && echo "true" || echo "")

          if [ -n "$exists" ];
          then
            echo "Version v$package_version already exists"
            echo "::warning file=package.json,line=1::Version v$package_version already exists - no release will be created. If you want to create a new release, please update the version in package.json and push again."
            echo "skipped=true" >> $GITHUB_OUTPUT
          else
            echo "Version v$package_version does not exist. Creating release..."
            echo "skipped=false" >> $GITHUB_OUTPUT
            echo "tag=v$package_version" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
      - name: Setup git
        if: ${{ steps.version-check.outputs.skipped == 'false' }}
        run: |
          git config --global user.email ${{ secrets.GH_EMAIL }}
          git config --global user.name ${{ secrets.GH_USERNAME }}
      - name: Generate oclif README
        if: ${{ steps.version-check.outputs.skipped == 'false' }}
        id: oclif-readme
        run: |
          npm install
          npm exec oclif readme
          if [ -n "$(git status --porcelain)" ]; then
            git add .
            git commit -am "chore: update README.md"
            git push -u origin ${{ github.ref_name }}
          fi
      - name: Create Github Release
        uses: ncipollo/release-action@2c591bcc8ecdcd2db72b97d6147f871fcd833ba5
        if: ${{ steps.version-check.outputs.skipped == 'false' }}
        with:
          name: ${{ steps.version-check.outputs.tag }}
          tag: ${{ steps.version-check.outputs.tag }}
          commit: ${{ github.ref_name }}
          token: ${{ secrets.GH_TOKEN }}
          skipIfReleaseExists: true

```

# .github/workflows/onRelease.yml

```yml
name: publish

on:
  release:
    types: [released]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: latest
      - run: npm install
      - run: npm run build
      - run: npm run prepack
      - uses: JS-DevTools/npm-publish@19c28f1ef146469e409470805ea4279d47c3d35c
        with:
          token: ${{ secrets.NPM_TOKEN }}
      - run: npm run postpack

```

# .github/workflows/test.yml

```yml
name: tests
on:
  push:
    branches-ignore: [main]
  workflow_dispatch:

jobs:
  unit-tests:
    strategy:
      matrix:
        os: ['ubuntu-latest', 'windows-latest']
        node_version: [lts/-1, lts/*, latest]
      fail-fast: false
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node_version }}
          cache: npm
      - run: npm install
      - run: npm run build
      - run: npm run test

```

# .gitignore

```
*-debug.log
*-error.log
**/.DS_Store
/.idea
/dist
/tmp
/node_modules
oclif.manifest.json



yarn.lock
pnpm-lock.yaml


```

# .mocharc.json

```json
{
  "require": [
    "ts-node/register"
  ],
  "watch-extensions": [
    "ts"
  ],
  "recursive": true,
  "reporter": "spec",
  "timeout": 60000,
  "node-option": [
    "loader=ts-node/esm",
    "experimental-specifier-resolution=node"
  ]
}

```

# .prettierrc.json

```json
"@oclif/prettier-config"

```

# .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Execute Command",
      "skipFiles": ["<node_internals>/**"],
      "runtimeExecutable": "node",
      "runtimeArgs": ["--loader", "ts-node/esm", "--no-warnings=ExperimentalWarning"],
      "program": "${workspaceFolder}/bin/dev.js",
      "args": ["hello", "world"]
    }
  ]
}

```

# eslint.config.mjs

```mjs
import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [includeIgnoreFile(gitignorePath), ...oclif, prettier]

```

# Makefile

```
.PHONY: dev build

dev:
	@./bin/dev.js $(filter-out $@,$(MAKECMDGOALS))

build:
	@./bin/run.js $(filter-out $@,$(MAKECMDGOALS))

# Catch-all pattern to prevent Make from complaining about unknown targets
%:
	@:


```

# package.json

```json
{
  "name": "cleanup",
  "description": "A CLI tool to clean TODOs out of your code and replace them with Linear tickets.",
  "version": "0.0.0",
  "author": "Shivansh Soni",
  "bin": {
    "cleanup": "./bin/run.js"
  },
  "bugs": "https://github.com/shivanished/cleanup/issues",
  "dependencies": {
    "@oclif/core": "^4",
    "@oclif/plugin-help": "^6",
    "@oclif/plugin-plugins": "^5"
  },
  "devDependencies": {
    "@eslint/compat": "^1",
    "@oclif/prettier-config": "^0.2.1",
    "@oclif/test": "^4",
    "@types/chai": "^4",
    "@types/mocha": "^10",
    "@types/node": "^18",
    "chai": "^4",
    "eslint": "^9",
    "eslint-config-oclif": "^6",
    "eslint-config-prettier": "^10",
    "mocha": "^10",
    "oclif": "^4",
    "shx": "^0.3.3",
    "ts-node": "^10",
    "typescript": "^5"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "./bin",
    "./dist",
    "./oclif.manifest.json"
  ],
  "homepage": "https://github.com/shivanished/cleanup",
  "keywords": [
    "oclif"
  ],
  "license": "MIT",
  "main": "dist/index.js",
  "type": "module",
  "oclif": {
    "bin": "cleanup",
    "dirname": "cleanup",
    "commands": "./dist/commands",
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-plugins"
    ],
    "topicSeparator": " ",
    "topics": {
      "hello": {
        "description": "Say hello to the world and others"
      }
    }
  },
  "repository": "shivanished/cleanup",
  "scripts": {
    "build": "shx rm -rf dist && tsc -b",
    "lint": "eslint",
    "postpack": "shx rm -f oclif.manifest.json",
    "posttest": "npm run lint",
    "prepack": "oclif manifest && oclif readme",
    "test": "mocha --forbid-only \"test/**/*.test.ts\"",
    "version": "oclif readme && git add README.md"
  },
  "types": "dist/index.d.ts"
}

```

# README.md

```md
cleanup
=================

A CLI tool to clean TODOs out of your code and replace them with Linear tickets.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cleanup.svg)](https://npmjs.org/package/cleanup)
[![Downloads/week](https://img.shields.io/npm/dw/cleanup.svg)](https://npmjs.org/package/cleanup)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
\`\`\`sh-session
$ npm install -g cleanup
$ cleanup COMMAND
running command...
$ cleanup (--version)
cleanup/0.0.0 darwin-arm64 node-v24.11.1
$ cleanup --help [COMMAND]
USAGE
  $ cleanup COMMAND
...
\`\`\`
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cleanup hello PERSON`](#cleanup-hello-person)
* [`cleanup hello world`](#cleanup-hello-world)
* [`cleanup help [COMMAND]`](#cleanup-help-command)
* [`cleanup plugins`](#cleanup-plugins)
* [`cleanup plugins add PLUGIN`](#cleanup-plugins-add-plugin)
* [`cleanup plugins:inspect PLUGIN...`](#cleanup-pluginsinspect-plugin)
* [`cleanup plugins install PLUGIN`](#cleanup-plugins-install-plugin)
* [`cleanup plugins link PATH`](#cleanup-plugins-link-path)
* [`cleanup plugins remove [PLUGIN]`](#cleanup-plugins-remove-plugin)
* [`cleanup plugins reset`](#cleanup-plugins-reset)
* [`cleanup plugins uninstall [PLUGIN]`](#cleanup-plugins-uninstall-plugin)
* [`cleanup plugins unlink [PLUGIN]`](#cleanup-plugins-unlink-plugin)
* [`cleanup plugins update`](#cleanup-plugins-update)

## `cleanup hello PERSON`

Say hello

\`\`\`
USAGE
  $ cleanup hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ cleanup hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
\`\`\`

_See code: [src/commands/hello/index.ts](https://github.com/shivanished/cleanup/blob/v0.0.0/src/commands/hello/index.ts)_

## `cleanup hello world`

Say hello world

\`\`\`
USAGE
  $ cleanup hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ cleanup hello world
  hello world! (./src/commands/hello/world.ts)
\`\`\`

_See code: [src/commands/hello/world.ts](https://github.com/shivanished/cleanup/blob/v0.0.0/src/commands/hello/world.ts)_

## `cleanup help [COMMAND]`

Display help for cleanup.

\`\`\`
USAGE
  $ cleanup help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cleanup.
\`\`\`

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.35/src/commands/help.ts)_

## `cleanup plugins`

List installed plugins.

\`\`\`
USAGE
  $ cleanup plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ cleanup plugins
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/index.ts)_

## `cleanup plugins add PLUGIN`

Installs a plugin into cleanup.

\`\`\`
USAGE
  $ cleanup plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into cleanup.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CLEANUP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CLEANUP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ cleanup plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ cleanup plugins add myplugin

  Install a plugin from a github url.

    $ cleanup plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ cleanup plugins add someuser/someplugin
\`\`\`

## `cleanup plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

\`\`\`
USAGE
  $ cleanup plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ cleanup plugins inspect myplugin
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/inspect.ts)_

## `cleanup plugins install PLUGIN`

Installs a plugin into cleanup.

\`\`\`
USAGE
  $ cleanup plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into cleanup.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CLEANUP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CLEANUP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ cleanup plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ cleanup plugins install myplugin

  Install a plugin from a github url.

    $ cleanup plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ cleanup plugins install someuser/someplugin
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/install.ts)_

## `cleanup plugins link PATH`

Links a plugin into the CLI for development.

\`\`\`
USAGE
  $ cleanup plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ cleanup plugins link myplugin
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/link.ts)_

## `cleanup plugins remove [PLUGIN]`

Removes a plugin from the CLI.

\`\`\`
USAGE
  $ cleanup plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cleanup plugins unlink
  $ cleanup plugins remove

EXAMPLES
  $ cleanup plugins remove myplugin
\`\`\`

## `cleanup plugins reset`

Remove all user-installed and linked plugins.

\`\`\`
USAGE
  $ cleanup plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/reset.ts)_

## `cleanup plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

\`\`\`
USAGE
  $ cleanup plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cleanup plugins unlink
  $ cleanup plugins remove

EXAMPLES
  $ cleanup plugins uninstall myplugin
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/uninstall.ts)_

## `cleanup plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

\`\`\`
USAGE
  $ cleanup plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cleanup plugins unlink
  $ cleanup plugins remove

EXAMPLES
  $ cleanup plugins unlink myplugin
\`\`\`

## `cleanup plugins update`

Update installed plugins.

\`\`\`
USAGE
  $ cleanup plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
\`\`\`

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/update.ts)_
<!-- commandsstop -->

```

# src/commands/config.ts

```ts
import {Args, Command, Flags} from '@oclif/core'

export default class Config extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Config)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/shivanshsoni/Desktop/cleanup/src/commands/config.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}

```

# src/commands/hello/index.ts

```ts
import {Args, Command, Flags} from '@oclif/core'

export default class Hello extends Command {
  static args = {
    person: Args.string({description: 'Person to say hello to', required: true}),
  }
  static description = 'Say hello'
  static examples = [
    `<%= config.bin %> <%= command.id %> friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
  ]
  static flags = {
    from: Flags.string({char: 'f', description: 'Who is saying hello', required: true}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Hello)

    this.log(`hello ${args.person} from ${flags.from}! (./src/commands/hello/index.ts)`)
  }
}

```

# src/commands/hello/world.ts

```ts
import {Command} from '@oclif/core'

export default class World extends Command {
  static args = {}
  static description = 'Say hello world'
  static examples = [
    `<%= config.bin %> <%= command.id %>
hello world! (./src/commands/hello/world.ts)
`,
  ]
  static flags = {}

  async run(): Promise<void> {
    this.log('hello world! (./src/commands/hello/world.ts)')
  }
}

```

# src/commands/login.ts

```ts
import {Args, Command, Flags} from '@oclif/core'

export default class Login extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Login)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/shivanshsoni/Desktop/cleanup/src/commands/login.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}

```

# src/commands/run.ts

```ts
import {Args, Command, Flags} from '@oclif/core'

export default class Run extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Run)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/shivanshsoni/Desktop/cleanup/src/commands/run.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}

```

# src/index.ts

```ts
export {run} from '@oclif/core'

```

# test/commands/config.test.ts

```ts
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('config', () => {
  it('runs config cmd', async () => {
    const {stdout} = await runCommand('config')
    expect(stdout).to.contain('hello world')
  })

  it('runs config --name oclif', async () => {
    const {stdout} = await runCommand('config --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

```

# test/commands/hello/index.test.ts

```ts
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('hello', () => {
  it('runs hello', async () => {
    const {stdout} = await runCommand('hello friend --from oclif')
    expect(stdout).to.contain('hello friend from oclif!')
  })
})

```

# test/commands/hello/world.test.ts

```ts
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('hello world', () => {
  it('runs hello world cmd', async () => {
    const {stdout} = await runCommand('hello world')
    expect(stdout).to.contain('hello world!')
  })
})

```

# test/commands/login.test.ts

```ts
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('login', () => {
  it('runs login cmd', async () => {
    const {stdout} = await runCommand('login')
    expect(stdout).to.contain('hello world')
  })

  it('runs login --name oclif', async () => {
    const {stdout} = await runCommand('login --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

```

# test/commands/run.test.ts

```ts
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('run', () => {
  it('runs run cmd', async () => {
    const {stdout} = await runCommand('run')
    expect(stdout).to.contain('hello world')
  })

  it('runs run --name oclif', async () => {
    const {stdout} = await runCommand('run --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

```

# test/tsconfig.json

```json
{
  "extends": "../tsconfig",
  "compilerOptions": {
    "noEmit": true
  },
  "references": [
    {"path": ".."}
  ]
}

```

# tsconfig.json

```json
{
  "compilerOptions": {
    "declaration": true,
    "module": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "target": "es2022",
    "moduleResolution": "node16"
  },
  "include": ["./src/**/*"],
  "ts-node": {
    "esm": true
  }
}

```

# tsconfig.tsbuildinfo

```tsbuildinfo
{"root":["./src/index.ts","./src/commands/hello/index.ts","./src/commands/hello/world.ts"],"version":"5.9.3"}
```

