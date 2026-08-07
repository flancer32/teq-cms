# NPM Package Configuration Rules

## Metadata Invariants

- `name` is `@flancer32/teq-cms`.
- `license` is `Apache-2.0`.
- `type` is `module`.
- `homepage`, `repository`, and `bugs` point to the canonical GitHub repository and its documentation/issues.
- `author` retains the upstream name, email, and URL block.

## Typing and Module System

- `types` is `./types.d.ts`.
- Runtime files are `.mjs` and follow Node ESM resolution.
- The package has no `exports` or `main` entry and no CommonJS compatibility layer.
- Type declarations use JSDoc and `.d.ts`; no `.ts` or `.tsx` sources are added.

## CLI Entry Point

The package uses the `@teqfw/cli` `teq` executable through npm scripts.
No package-owned `bin/teq-cms.mjs` bridge is maintained.

## Dependencies

Runtime dependencies include `@flancer32/teq-tmpl`, `@flancer32/teq-web`, `@teqfw/cfg`, `@teqfw/cli`, `@teqfw/di`, and `@teqfw/log`. OpenAI-compatible APIs are accessed through the native Node.js `fetch` API.
The development dependency `nunjucks` is required for template tests.

## Package Contents

The `files` allowlist publishes runtime sources, templates, web assets, the
package-owned consumer skill under `skills/`, declarations, and required
package documentation.
Development-only directories such as `test/`, `doc/`, and `ctx/` remain outside the npm payload.

## Runtime Baseline

The minimum supported Node.js version is 20.
