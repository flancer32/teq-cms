# NPM Exports Rules

## Export Prohibition

TeqCMS must not define the `exports` field at the package root or any subpath.
TeqFW DI loads implementation files through dynamic imports and namespace paths; Node.js subpath exports would restrict that access.

## Public Surface

The public package surface is declared through DI namespaces and type declarations rather than Node.js subpath exports.

## CLI Integration

CLI commands are exposed through the production dependency `@teqfw/cli` and static `teqfw.fw.cli` package metadata.
TeqCMS does not expose a custom `bin` bridge or mirror commands in an `exports` entry.

## Invariants

- No root or subpath `exports` field.
- No combination of `main` and `exports`.
- No dual-module configuration mixing CommonJS and ESM entry points.
- Internal source files remain accessible for DI-based loading.
