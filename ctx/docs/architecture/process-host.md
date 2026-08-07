# TeqCMS Process Host

## Purpose

TeqCMS does not publish or maintain a custom `bin/teq-cms.mjs` launcher.
The standard `@teqfw/cli` `teq` executable creates the container, discovers package metadata, applies the host configurator, loads CLI plugins, selects commands, and owns process exit status.

## Package Metadata

The package declares:

- `teqfw.fw.di.namespaces` for the `Fl32_Cms_` source namespace;
- `teqfw.fw.cli.container.configurator` for host preprocessors;
- `teqfw.fw.cli.plugin` for configuration loading;
- `teqfw.fw.cli.commands` for `web:start` and `translate`;
- `teqfw.fw.cli.command.default` for `web:start`.

The package script invokes the published executable as `teq web:start`.
TeqCMS must not import `@teqfw/cli/src/**` or invoke an internal launcher path from package scripts.

## Host Configurator

The configurator is a default-exported class with `configure({applicationRoot, argv})`.
It may return namespace roots, preprocessors, postprocessors, or diagnostic logging.
It must not receive or construct the DI container.

## Commands

- `web:start` is a long-running command with `start({signal})` returning `{done, stop}`.
- `translate` is a finite command with `execute(context)`.
- Commands must not call `process.exit` or assign `process.exitCode`.

## Configuration Lifecycle

The declared CMS CLI plugin loads `@teqfw/cfg` sources before command selection.
It loads TeqCMS defaults, an optional `.env`, and process environment values.
Commands resolve only after this startup phase.

## Invariants

- The process host and container are created only by `@teqfw/cli`.
- CMS components remain DI-addressed and do not import host internals.
- Application extensions use the public configurator boundary.
- Signals and shutdown are coordinated by `@teqfw/cli`.
