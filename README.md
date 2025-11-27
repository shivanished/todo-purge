todo-purge
=================

A CLI tool to clean TODOs out of your code and replace them with Linear tickets.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/todo-purge.svg)](https://npmjs.org/package/todo-purge)
[![Downloads/week](https://img.shields.io/npm/dw/todo-purge.svg)](https://npmjs.org/package/todo-purge)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g todo-purge
$ todo-purge COMMAND
running command...
$ todo-purge (--version)
todo-purge/0.1.0 darwin-arm64 node-v24.11.1
$ todo-purge --help [COMMAND]
USAGE
  $ todo-purge COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`todo-purge login`](#todo-purge-login)
* [`todo-purge run`](#todo-purge-run)

## `todo-purge login`

Authenticate with Linear API, store credentials, and optionally add an OpenAI API key

```
USAGE
  $ todo-purge login [--switch-team] [--openai-key <value>]

FLAGS
  --openai-key=<value>  OpenAI API key for enhanced ticket descriptions
  --switch-team         Switch teams using your existing login

DESCRIPTION
  Authenticate with Linear API, store credentials, and optionally add an OpenAI API key

EXAMPLES
  $ todo-purge login

  $ todo-purge login --switch-team

  $ todo-purge login --openai-key=sk-67
```

_See code: [src/commands/login.ts](https://github.com/shivanished/todo-purge/blob/v0.1.0/src/commands/login.ts)_

## `todo-purge run`

Scan codebase for TODOs and FIXMEs, create Linear tickets, and remove comments

```
USAGE
  $ todo-purge run [--context-lines <value>] [--keep-comments] [--no-ai]

FLAGS
  --context-lines=<value>  [default: 5,10] Number of lines above and below TODO to include (format: above,below)
  --keep-comments          Keep TODO comments in files instead of removing them
  --no-ai                  Disable AI-generated descriptions even if OpenAI key is configured

DESCRIPTION
  Scan codebase for TODOs and FIXMEs, create Linear tickets, and remove comments

EXAMPLES
  $ todo-purge run

  $ todo-purge run --context-lines=5,10 --no-ai --keep-comments
```

_See code: [src/commands/run.ts](https://github.com/shivanished/todo-purge/blob/v0.1.0/src/commands/run.ts)_
<!-- commandsstop -->
