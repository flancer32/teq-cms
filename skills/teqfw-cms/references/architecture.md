# TeqCMS Architecture

TeqCMS is a multilingual CMS composed as a TeqFW application. Version-controlled
Markdown files are authored sources; human-facing HTML is rendered from them
through host-owned presentation templates. Existing HTML template routes remain
supported.
Its runtime is DI-addressed and normally runs under the `@teqfw/cli` process
host.

## Runtime boundaries

- The CLI executable owns the process, container creation, startup ordering,
  command selection, signals, shutdown, and exit status.
- `bootstrap/di-config.mjs` is the standalone host's pre-DI composition
  boundary. It is dynamically imported before DI and therefore cannot use DI.
- `Fl32_Cms_Back_Cli_Plugin` participates in lifecycle startup and registers
  the CMS static, logging, and template handlers in the web pipeline.
- `@teqfw/web` owns the long-running `web:start` command.
- TeqCMS owns the finite `cms:generate` command and publication discovery.
- `@flancer32/teq-tmpl` owns localized template configuration, target and
  rendering contracts, and the available engine implementations.
- Site-wide Markdown publication is CMS-owned and is enabled by default without family registration. The host substitutes `Fl32_Cms_Back_Publication_Policy$` to select presentation names and static-only prefixes in code. Routing, Source, Catalog, HTTP, and discovery share that policy. Neutral sources prefer unlocalized, then maintained `en`, then tmpl default; localized representations require exact sources. Markdown source selection precedes templates and static files, while static exclusions bypass templates. Source priority does not select response format: explicit `.md`/`.html` overrides headers; extensionless URLs use `Accept`, then `User-Agent` hints, defaulting to HTML. Neutral extensionless HTML and Markdown share source selection; explicit neutral `.html` uses the default locale. Markdown discovery and alternate links use explicit `.md`. Root `index` has canonical `/` and localized `/{locale}/` addresses. Nonempty legacy families retain their previous semantics. See the publication guide for source eligibility, alias rules, and migration.

## Composition rules

The package metadata is the discovery surface for the runtime namespace and
CLI components. The canonical namespace metadata is
`teqfw.fw.di.namespaces`, mapping `Fl32_Cms_` to `./src` with `.mjs` files.
Internal components use DI CDC identifiers and do not access the Container.

The host selects the concrete template engine at composition time. The
`TEQFW_TMPL__ENGINE` value is host composition input for that decision, not
a tmpl package setting or an automatic DI alias. TeqCMS's standalone adapter
delegates to the selected tmpl provider; an embedding application may install
another mapping that implements the same contract.

The application root is supplied as the CLI runtime value
`TeqFw_Cli_Config$.applicationRoot`. It is not a CMS setting and should not be
replaced with a `TEQ_CMS` or `TEQFW_TMPL` root-path key.
