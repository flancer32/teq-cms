# TeqCMS Process Host

- Path: `ctx/docs/architecture/process-host.md`
- Changed: `20260930`

## Purpose

TeqCMS does not publish or maintain a custom `bin/teq-cms.mjs` launcher.
The standard `@teqfw/cli` `teq` executable creates the container, discovers package metadata, applies the host configurator, starts lifecycle plugins, selects commands, and owns process exit status.

## Package Metadata

The package declares:

- `teqfw.fw.di.namespaces` for the `Fl32_Cms_` source namespace;
- `teqfw.fw.cli.container.configurator` for the pre-DI host configurator;
- `teqfw.fw.cli.plugin` for web-pipeline setup;
- `teqfw.fw.cli.commands` for `cms:generate`;
- `teqfw.fw.cli.command.default` for `web:start` provided by `@teqfw/web`.

The package script invokes the published executable as `teq web:start`.
The standalone host configurator is `bootstrap/di-config.mjs`.
TeqCMS must not import `@teqfw/cli/src/**` or invoke an internal launcher path from package scripts.

## Commands

- `web:start` is the long-running command supplied by `@teqfw/web`.
- `cms:generate` is a finite command with `execute(context)` for discovery files.
- Commands must not call `process.exit` or assign `process.exitCode`.

## Configuration Lifecycle

The CLI host supplies and loads configuration Sources once before resolving lifecycle plugins and commands. The standalone CMS configurator declares DI preprocessors and does not provide configuration Sources. The CMS CLI
plugin then registers the agent-message, publication, static, and template handlers before `web:start`
locks the pipeline. Typed package configuration components read their own
namespaces through `TeqFw_Cfg_Reader$`.

Configuration keys use the canonical TeqFW form `NAMESPACE__PARAMETER`. The
`TEQFW_TMPL` and `TEQFW_WEB` namespaces belong to their respective plugins;
`TEQ_CMS` contains only CMS-specific settings. Legacy `TEQ_CMS_*` names are not
supported.

The standalone host selects one `@flancer32/teq-tmpl` implementation and binds
it to the contract through DI using `TEQFW_TMPL__ENGINE` as a host composition
setting. The tmpl package offers the engine contract and implementations; its
typed configuration does not expose an engine selector.

The CLI supplies `TeqFw_Cli_Config$.applicationRoot` as a computed runtime fact. Tmpl exposes it through `getRootPath()`, and CMS consumers use that accessor for content and output paths. The root is not inferred from the working directory by CMS components and is not a CMS configuration key.

## Invariants

- The process host and container are created only by `@teqfw/cli`.
- CMS components remain DI-addressed and do not import host internals.
- Application extensions use the public platform composition boundary.
- Signals and shutdown are coordinated by `@teqfw/cli`.
