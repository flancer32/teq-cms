# Architecture Decisions

## Dependency Migration Checkpoint

Platform dependencies are switched before runtime compatibility is restored. A temporarily broken application is acceptable at this checkpoint because it exposes the actual integration delta.

## Web Package Boundary

The renewed `@flancer32/teq-web` package is updated as a separate compatibility boundary. It must not be silently replaced by `@teqfw/web` without an explicit decision and contract review.

## Documentation Consolidation

The former legacy context branches were projected into the four ADSM documentation levels under `ctx/docs/` and are no longer part of the context structure.
