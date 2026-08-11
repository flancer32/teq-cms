# TeqCMS Process Host

## Purpose

TeqCMS does not publish or maintain a custom `bin/teq-cms.mjs` launcher.
The standard `@teqfw/cli` `teq` executable creates the container, discovers package metadata, applies the host configurator, starts lifecycle plugins, selects commands, and owns process exit status.

## Package Metadata

The package declares:

- `teqfw.fw.di.namespaces` for the `Fl32_Cms_` source namespace;
- `teqfw.fw.cli.container.configurator` for the pre-DI host configurator;

The canonical standalone host path for this module is `bootstrap/di-config.mjs`.
- `teqfw.fw.cli.plugin` for web-pipeline setup;
- `teqfw.fw.cli.commands` for `translate`;
- `teqfw.fw.cli.command.default` for `web:start` provided by `teq-web`.

The package script invokes the published executable as `teq web:start`.
TeqCMS must not import `@teqfw/cli/src/**` or invoke an internal launcher path from package scripts.

## Commands

- `web:start` is the long-running command supplied by `@teqfw/web`.
- `cms:translate` is a finite command with `execute(context)`.
- Commands must not call `process.exit` or assign `process.exitCode`.

## Configuration Lifecycle

The host configurator provides ordered configuration Sources. `@teqfw/cli`
loads them once before resolving lifecycle plugins and commands. The CMS CLI
plugin then registers the static and template handlers before `web:start`
locks the pipeline. Typed package configuration components read their own
namespaces through `TeqFw_Cfg_Reader$`.

Configuration keys use the canonical TeqFW form `NAMESPACE__PARAMETER`. The
`TEQFW_TMPL` and `TEQFW_WEB` namespaces belong to their respective plugins;
`TEQ_CMS` contains only CMS-specific settings. Legacy `TEQ_CMS_*` names are not
supported.

The platform host selects one `@flancer32/teq-tmpl` implementation and binds it
to the contract through DI using `TEQFW_TMPL__ENGINE`. The tmpl package offers
the engine contract and available implementations.

The platform-owned application root remains an open CLI contract. Until the
platform exposes it to configuration Sources, the CMS uses the process working
directory as the root fallback; this fallback is not a CMS configuration key.

## Invariants

- The process host and container are created only by `@teqfw/cli`.
- CMS components remain DI-addressed and do not import host internals.
- Application extensions use the public platform composition boundary.
- Signals and shutdown are coordinated by `@teqfw/cli`.
