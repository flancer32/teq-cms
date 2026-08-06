# NPM Publish Rules

Path: `ctx/rules/env/npm/publish.md`

## Purpose

Set the allowable filesystem contents, build expectations, and versioning requirements for the npm package that hosts TeqCMS logic.

## 1. Package contents

- The published tarball must include only runtime sources (`src/`), CLI scripts (`bin/`), declaration files (`.d.ts`), and the configuration files required at runtime.
- Inclusion/exclusion lists are enforced via `"files"` in `package.json` or via `.npmignore` so that auxiliary directories remain out of the bundle.

## 2. Excluded directories and artifacts

- Exclude `test/`, `doc/`, `ctx/`, temporary artifacts, build output, and any other development-only files from the published package.

## 3. Executable files

- CLI entry points referenced in `"bin"` must point to `.mjs` files and keep their executable permission flags inside the repository.
- Do not expose CLI scripts through an `"exports"` entry (see `exports.md`).

## 4. Build constraints

- The package must be publishable without a build step: no bundling, transpilation, code generation, or use of external compilation tooling is permitted before publishing.

## 5. Versioning

- Maintain semantic versioning; any change to files delivered to npm or observable CLI behavior constitutes a breaking change and must update the version accordingly.

## 6. Invariants

- Published contents must match the `package.json` constraints from `package.md` (runtime structure, dependencies, typing entries) and the typing requirements from `types.md`.
- The package payload must leave the DI module-loading expectations from `ctx/rules/arch/di/*` intact.
