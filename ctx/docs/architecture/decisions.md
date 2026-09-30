# Architecture Decisions

- Path: `ctx/docs/architecture/decisions.md`
- Changed: `20260930`

## Dependency Migration Checkpoint

The prior dependency-switch checkpoint has been completed. Current package
compatibility is established by the checks in `../code/verification.md`.

## Web Package Boundary

TeqCMS uses `@teqfw/web` 2.x for the HTTP pipeline, server transport, and static delivery. CMS publication policy remains in TeqCMS.

## Documentation Consolidation

The former legacy context branches were projected into the four ADSM documentation levels under `ctx/docs/` and are no longer part of the context structure.

## Template Engine Composition

TeqCMS uses `@flancer32/teq-tmpl` for template rendering. The tmpl package owns
the locale settings in `TEQFW_TMPL`, the engine contract, and the offered
provider implementations. The standalone CMS host reads `TEQFW_TMPL__ENGINE`
as its own composition choice; tmpl does not project or select that setting.
Platform composition owns configuration loading and the final engine binding.
TeqCMS provides both the host configurator and the
startup plugin when it runs as the standalone development host. The plugin also
registers the CMS web pipeline before the `web:start` command locks it.

Legacy `TEQ_CMS_*` configuration names are not supported. The platform-owned
application root is supplied by `TeqFw_Cli_Config$.applicationRoot` and is not a CMS setting.

## Markdown Publication Presentation

Each publication family uses a configured presentation template. TeqCMS supplies publication data and representation links under the contract in [publication.md](publication.md). The host template owns layout and page composition. The contract supports several non-overlapping route prefixes without a host adapter or a fixed article taxonomy.

## Publication Resource and Locale

Locale and representation are independent concerns. Explicit locale variants remain authored sources; localized HTML is a projection of the publication resource. The neutral Markdown resource follows the source preference defined in [the product model](../product/overview.md), using existing tmpl locale configuration. Explicit `.md` and `.html` suffixes override headers at the HTTP boundary. Extensionless URLs negotiate representation by `Accept`, then `User-Agent`, defaulting to HTML for ambiguous clients. Extensionless neutral HTML and Markdown share neutral source selection; only explicit neutral `.html` requires the exact maintained tmpl default locale. HTML canonical addresses remain extensionless; guaranteed Markdown links use `.md`, including `/index.md` for home. This keeps publication policy in TeqCMS without a separate language policy for agents or a translation service.

## Site Publication Policy

The public template tree defines the site corpus. Family registration is no longer required in the default mode. Route and presentation decisions belong to host code through the replaceable publication Policy contract. Deployment configuration retains base URL and private-contact settings; the old family list is retained only for compatibility.

Markdown precedes ordinary templates and static files. Static policy prefixes bypass all templating, while a found invalid Markdown source returns 404. Unlocalized `index.md` owns the neutral home address. Routing owns canonical identity shared by HTTP and discovery, including root index aliases.
