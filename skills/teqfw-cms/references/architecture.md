# TeqCMS Architecture

TeqCMS is a file-based multilingual CMS composed as a TeqFW application.
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
- TeqCMS owns the finite `cms:translate` command and the CMS translation
  domain services.
- `@flancer32/teq-tmpl` owns localized template configuration, target and
  rendering contracts, and the available engine implementations.

## Composition rules

The package metadata is the discovery surface for the runtime namespace and
CLI components. The canonical namespace metadata is
`teqfw.fw.di.namespaces`, mapping `Fl32_Cms_` to `./src` with `.mjs` files.
Internal components use DI CDC identifiers and do not access the Container.

The host selects the concrete template engine at composition time. The
`TEQFW_TMPL__ENGINE` value is configuration input for that host decision, not
an automatic DI alias. TeqCMS's standalone adapter delegates to the selected
tmpl provider; an embedding application may install another mapping that
implements the same contract.

The application root is supplied as the CLI runtime value
`TeqFw_Cli_Config$.applicationRoot`. It is not a CMS setting and should not be
replaced with a `TEQ_CMS` or `TEQFW_TMPL` root-path key.
