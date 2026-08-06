# NPM Package Configuration Rules

Path: `ctx/rules/env/npm/package.md`

## Purpose

Capture the immutable fields and layout decisions of `package.json` that preserve TeqCMS identity, package compatibility, and the npm surface contract regardless of version bumps.

## 1. Metadata invariants

- `"name": "@flancer32/teq-cms"` - anchors the package identity inside the TeqFW ecosystem.
- `"license": "Apache-2.0"` - public license must remain unchanged.
- `"type": "module"` - enforces the ESM-only contract described in `exports.md` and related documents.
- `"homepage"` / `"repository"` / `"bugs"` - each must point to the canonical GitHub repository, its README, and the issues page respectively.
- `"author"` - must declare `name`, `email`, and `url` to retain the upstream contact block.

These metadata fields tie the package to its canonical source and should remain unchanged except for non-functional detail updates.

## 2. Typing invariants

- `"types": "./types.d.ts"` - the root declaration file in the package root defines the public type surface described in `types.md`.
- Typing is delivered entirely through `.d.ts` files and JSDoc annotations in `.js`/`.mjs`; no `.ts`/`.tsx` sources or generated `d.ts` bundles may be added.

## 3. Module system

- The package exposes only ESM entry points; every runtime file must be `.js` or `.mjs` and follow Node ESM resolution.
- `exports` is forbidden (see `exports.md`), so `"main"` must not be introduced. No CommonJS entry points may coexist with the ESM modules.
- `package.json` must never define dual-module configuration.

## 4. CLI entry points

- When a CLI is published, `"bin"` must contain `"teq-cms": "./bin/teq-cms.mjs"`.
- CLI scripts must be `.mjs` and retain executable permissions within the repository.

## 5. Dependencies

Runtime dependencies must always list the following packages by name (versions may float):

- `"@flancer32/teq-tmpl"`
- `"@flancer32/teq-web"`
- `"@teqfw/di"`
- `"dotenv"`
- `"openai"`

Development dependencies must always include:

- `"eslint"` and `"@eslint/js"`
- `"eslint-plugin-jsdoc"`
- `"mocha"`
- `"nunjucks"`

Only package names are invariant; version specifiers are adjustable.

## 6. Node.js engine requirement

- `"engines": { "node": ">=20" }` (or an equivalent string specifying Node 20 as the minimum) - this lower bound must be explicit to match TeqFW runtime targets.

## 7. Package contents

- The published package must contain only runtime sources (`src/`), CLI scripts (`bin/`), declaration files (`.d.ts`), and minimal configuration files.
- Development-only directories such as `test/`, `doc/`, `ctx/`, temporary artifacts, and generated output must be excluded via `"files"` or `.npmignore` to keep the npm payload minimal.

## 8. Invariants

- No package field may contradict the ESM-only architecture, JSDoc typing rules, or the dependency-injection expectations under `ctx/rules/arch/*`.
- `package.json` must stay consistent with the typing environment (`jsconfig.md`), export rules (`exports.md`), and publish constraints (`publish.md`).
- Typing invariants described in `types.md` must align with the `"types"` entry here.
