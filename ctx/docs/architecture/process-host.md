# TeqCMS Process Host

## Purpose

TeqCMS does not publish or maintain a custom `bin/teq-cms.mjs` launcher.
The standard `@teqfw/cli` `teq` executable creates the container, discovers package metadata, applies the host configurator, loads CLI plugins, selects commands, and owns process exit status.

## Package Metadata

The package declares:

- `teqfw.fw.di.namespaces` for the `Fl32_Cms_` source namespace;
- `teqfw.fw.cli.container.configurator` for host preprocessors, implemented by
  the pre-DI module `bootstrap/configurator.mjs`;
- `teqfw.fw.cli.plugin` for configuration loading;
- `teqfw.fw.cli.commands` for `web:start` and `translate`;
- `teqfw.fw.cli.command.default` for `web:start`.

The package script invokes the published executable as `teq web:start`.
TeqCMS must not import `@teqfw/cli/src/**` or invoke an internal launcher path from package scripts.

## Host Configurator

The configurator is a default-exported class with `configure({applicationRoot, argv})`.
It may return namespace roots, preprocessors, postprocessors, or diagnostic logging.
It is loaded through a dynamic import before DI Container resolution, so it must
not receive or construct the DI container or depend on DI-addressed modules.

## Commands

- `web:start` is a long-running command with `start({signal})` returning `{done, stop}`.
- `translate` is a finite command with `execute(context)`.
- Commands must not call `process.exit` or assign `process.exitCode`.

## Configuration Lifecycle

The declared CMS CLI plugin loads `@teqfw/cfg` sources before command selection.
It loads static application defaults, an optional `.env`, and process environment
values in that order. Later Sources override complete keys from earlier Sources.
The host configurator always maps the tmpl engine contract to
`Fl32_Cms_Back_Di_Replace_Tmpl_Engine`; that wrapper is instantiated only after this
startup phase and then reads the typed tmpl configuration.

Configuration keys use the canonical TeqFW form `NAMESPACE__PARAMETER`. The
`TEQFW_TMPL` and `TEQFW_WEB` namespaces belong to their respective plugins;
`TEQ_CMS` contains only CMS-specific settings. Legacy `TEQ_CMS_*` names are not
supported.

TeqCMS is the host application for `@flancer32/teq-tmpl`. The tmpl package
offers the engine contract and available implementations. TeqCMS owns the
selection of one implementation and binds it to the contract through DI using
`TEQFW_TMPL__ENGINE`; the tmpl package does not perform that host selection.

The platform-owned application root remains an open CLI contract. Until the
platform exposes it to configuration Sources, the CMS uses the process working
directory as the root fallback; this fallback is not a CMS configuration key.

## Invariants

- The process host and container are created only by `@teqfw/cli`.
- CMS components remain DI-addressed and do not import host internals.
- Application extensions use the public configurator boundary.
- Signals and shutdown are coordinated by `@teqfw/cli`.
