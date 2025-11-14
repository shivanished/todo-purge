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
```sh-session
$ npm install -g cleanup
$ cleanup COMMAND
running command...
$ cleanup (--version)
cleanup/0.0.0 darwin-arm64 node-v24.11.1
$ cleanup --help [COMMAND]
USAGE
  $ cleanup COMMAND
...
```
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

```
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
```

_See code: [src/commands/hello/index.ts](https://github.com/shivanished/cleanup/blob/v0.0.0/src/commands/hello/index.ts)_

## `cleanup hello world`

Say hello world

```
USAGE
  $ cleanup hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ cleanup hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/shivanished/cleanup/blob/v0.0.0/src/commands/hello/world.ts)_

## `cleanup help [COMMAND]`

Display help for cleanup.

```
USAGE
  $ cleanup help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cleanup.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.35/src/commands/help.ts)_

## `cleanup plugins`

List installed plugins.

```
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
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/index.ts)_

## `cleanup plugins add PLUGIN`

Installs a plugin into cleanup.

```
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
```

## `cleanup plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
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
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/inspect.ts)_

## `cleanup plugins install PLUGIN`

Installs a plugin into cleanup.

```
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
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/install.ts)_

## `cleanup plugins link PATH`

Links a plugin into the CLI for development.

```
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
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/link.ts)_

## `cleanup plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
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
```

## `cleanup plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ cleanup plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/reset.ts)_

## `cleanup plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
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
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/uninstall.ts)_

## `cleanup plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
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
```

## `cleanup plugins update`

Update installed plugins.

```
USAGE
  $ cleanup plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/update.ts)_
<!-- commandsstop -->
