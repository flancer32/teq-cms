# Architecture Decisions

## Dependency Migration Checkpoint

Platform dependencies are switched before runtime compatibility is restored. A temporarily broken application is acceptable at this checkpoint because it exposes the actual integration delta.

## Web Package Boundary

The renewed `@teqfw/web` package is updated as a separate compatibility boundary. It must not be silently replaced by `@teqfw/web` without an explicit decision and contract review.

## Documentation Consolidation

The former legacy context branches were projected into the four ADSM documentation levels under `ctx/docs/` and are no longer part of the context structure.

## Template Engine Composition

TeqCMS uses `@flancer32/teq-tmpl` for template rendering. The tmpl package owns
the `TEQFW_TMPL` configuration projection, the engine contract, and the offered
provider implementations. Platform composition owns configuration loading and
the final engine binding. TeqCMS provides both the host configurator and the
startup plugin when it runs as the standalone development host. The plugin also
registers the CMS web pipeline before the `teq-web` start command locks it.

Legacy `TEQ_CMS_*` configuration names are not supported. The platform-owned
application root is not a CMS setting; the current process-working-directory
fallback remains temporary until the CLI host exposes its application root to
configuration Sources.
