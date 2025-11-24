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
todo-purge/0.0.0 darwin-arm64 node-v24.11.1
$ todo-purge --help [COMMAND]
USAGE
  $ todo-purge COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`todo-purge hello PERSON`](#todo-purge-hello-person)
* [`todo-purge hello world`](#todo-purge-hello-world)
* [`todo-purge help [COMMAND]`](#todo-purge-help-command)
* [`todo-purge plugins`](#todo-purge-plugins)
* [`todo-purge plugins add PLUGIN`](#todo-purge-plugins-add-plugin)
* [`todo-purge plugins:inspect PLUGIN...`](#todo-purge-pluginsinspect-plugin)
* [`todo-purge plugins install PLUGIN`](#todo-purge-plugins-install-plugin)
* [`todo-purge plugins link PATH`](#todo-purge-plugins-link-path)
* [`todo-purge plugins remove [PLUGIN]`](#todo-purge-plugins-remove-plugin)
* [`todo-purge plugins reset`](#todo-purge-plugins-reset)
* [`todo-purge plugins uninstall [PLUGIN]`](#todo-purge-plugins-uninstall-plugin)
* [`todo-purge plugins unlink [PLUGIN]`](#todo-purge-plugins-unlink-plugin)
* [`todo-purge plugins update`](#todo-purge-plugins-update)

## `todo-purge hello PERSON`

Say hello

```
USAGE
  $ todo-purge hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ todo-purge hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/shivanished/todo-purge/blob/v0.0.0/src/commands/hello/index.ts)_

## `todo-purge hello world`

Say hello world

```
USAGE
  $ todo-purge hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ todo-purge hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/shivanished/todo-purge/blob/v0.0.0/src/commands/hello/world.ts)_

## `todo-purge help [COMMAND]`

Display help for todo-purge.

```
USAGE
  $ todo-purge help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for todo-purge.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.35/src/commands/help.ts)_

## `todo-purge plugins`

List installed plugins.

```
USAGE
  $ todo-purge plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ todo-purge plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/index.ts)_

## `todo-purge plugins add PLUGIN`

Installs a plugin into todo-purge.

```
USAGE
  $ todo-purge plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

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
  Installs a plugin into todo-purge.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CLEANUP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CLEANUP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ todo-purge plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ todo-purge plugins add myplugin

  Install a plugin from a github url.

    $ todo-purge plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ todo-purge plugins add someuser/someplugin
```

## `todo-purge plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ todo-purge plugins inspect PLUGIN...

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
  $ todo-purge plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/inspect.ts)_

## `todo-purge plugins install PLUGIN`

Installs a plugin into todo-purge.

```
USAGE
  $ todo-purge plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

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
  Installs a plugin into todo-purge.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CLEANUP_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CLEANUP_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ todo-purge plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ todo-purge plugins install myplugin

  Install a plugin from a github url.

    $ todo-purge plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ todo-purge plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/install.ts)_

## `todo-purge plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ todo-purge plugins link PATH [-h] [--install] [-v]

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
  $ todo-purge plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/link.ts)_

## `todo-purge plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ todo-purge plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ todo-purge plugins unlink
  $ todo-purge plugins remove

EXAMPLES
  $ todo-purge plugins remove myplugin
```

## `todo-purge plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ todo-purge plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/reset.ts)_

## `todo-purge plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ todo-purge plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ todo-purge plugins unlink
  $ todo-purge plugins remove

EXAMPLES
  $ todo-purge plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/uninstall.ts)_

## `todo-purge plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ todo-purge plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ todo-purge plugins unlink
  $ todo-purge plugins remove

EXAMPLES
  $ todo-purge plugins unlink myplugin
```

## `todo-purge plugins update`

Update installed plugins.

```
USAGE
  $ todo-purge plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/update.ts)_
<!-- commandsstop -->
