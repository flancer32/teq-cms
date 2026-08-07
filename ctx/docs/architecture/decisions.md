# Architecture Decisions

## Dependency Migration Checkpoint

Platform dependencies are switched before runtime compatibility is restored. A temporarily broken application is acceptable at this checkpoint because it exposes the actual integration delta.

## Web Package Boundary

The renewed `@flancer32/teq-web` package is updated as a separate compatibility boundary. It must not be silently replaced by `@teqfw/web` without an explicit decision and contract review.

## Documentation Consolidation

The former legacy context branches were projected into the four ADSM documentation levels under `ctx/docs/` and are no longer part of the context structure.

## Template Engine Composition

TeqCMS is the host application for `@flancer32/teq-tmpl`. The tmpl package owns
the `TEQFW_TMPL` configuration projection, the engine contract, and the offered
provider implementations. TeqCMS owns the final engine choice through the host
adapter `Fl32_Cms_Back_Di_Replace_Tmpl_Engine`. The configurator binds the stable tmpl
engine contract to that adapter; after cfg loading, the adapter reads
`TEQFW_TMPL__ENGINE` through `Fl32_Tmpl_Back_Config$` and delegates to the
selected provider. The tmpl package does not automatically perform that DI
selection.

Legacy `TEQ_CMS_*` configuration names are not supported. The platform-owned
application root is not a CMS setting; the current process-working-directory
fallback remains temporary until the CLI host exposes its application root to
configuration Sources.
