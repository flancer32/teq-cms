# Dependency Injection Rules

## Composition Root

TeqCMS uses `@teqfw/di` as the sole mechanism for linking modules.
The `@teqfw/cli` executable creates the container once and assembles the dependency graph.
TeqCMS contributes namespace metadata, a host configurator, a CLI lifecycle
plugin, and the `cms:translate` command descriptor through `package.json`.

All DI-environment modifications occur at the composition boundary.
Internal modules resolve dependencies through DI identifiers and must not access the container directly.

## Application Extensions

Applications customize TeqCMS through the public configurator mechanism or
package metadata.
It must not contain static imports from TeqCMS or depend on application code from the CMS package.

## Invariants

- Internal components depend on DI tokens rather than host implementation paths.
- The application must not access the container outside the composition root.
- Host applications customize the CMS through the public configurator boundary.
- The CMS remains an isolated core.
- Runtime settings are read through package-owned typed configuration components;
  business components do not read `process.env` or raw CMS configuration.
- The host application selects the concrete template engine in host composition
  from the `TEQFW_TMPL__ENGINE` setting. `@flancer32/teq-tmpl` offers the engine
  contract and implementations.
