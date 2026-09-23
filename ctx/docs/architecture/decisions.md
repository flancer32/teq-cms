# Architecture Decisions

- Path: `ctx/docs/architecture/decisions.md`
- Changed: `20260923`

## Dependency Migration Checkpoint

The prior dependency-switch checkpoint has been completed. The current runtime uses the installed CLI, DI, cfg, tmpl, and web package contracts and is verified by unit tests, acceptance tests, type checking, and ESM validation.

## Web Package Boundary

TeqCMS uses `@teqfw/web` 2.x for the HTTP pipeline, server transport, and static delivery. CMS publication policy remains in TeqCMS.

## Documentation Consolidation

The former legacy context branches were projected into the four ADSM documentation levels under `ctx/docs/` and are no longer part of the context structure.

## Template Engine Composition

TeqCMS uses `@flancer32/teq-tmpl` for template rendering. The tmpl package owns
the `TEQFW_TMPL` configuration projection, the engine contract, and the offered
provider implementations. Platform composition owns configuration loading and
the final engine binding. TeqCMS provides both the host configurator and the
startup plugin when it runs as the standalone development host. The plugin also
registers the CMS web pipeline before the `web:start` command locks it.

Legacy `TEQ_CMS_*` configuration names are not supported. The platform-owned
application root is supplied by `TeqFw_Cli_Config$.applicationRoot` and is not a CMS setting.

## Markdown Publication Presentation

Issue #29 uses a configured presentation template per publication family. TeqCMS supplies parsed metadata, rendered Markdown HTML, canonical and locale alternate URLs, and a Markdown alternate URL only for a public machine locale. The host template owns layout and page composition. The contract supports several non-overlapping route prefixes without a host adapter or a fixed article taxonomy.
