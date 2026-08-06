# NPM Exports Rules

Path: `ctx/rules/env/npm/exports.md`

## Purpose

Define the permissible surface of `package.json` for TeqCMS and other TeqFW plugins, ensuring the dependency-injection container can reach every required file without disruption from Node.js export restrictions.

## 1. Export prohibition

- TeqFW plugins **must not define** the `"exports"` field at the package root or any subpath. Node.js subpath exports lock the filesystem tree and prevent TeqFW DI from loading implementation files directly.

## 2. Rationale

- TeqFW relies on dynamic imports and DI namespaces that expect the runtime files to be accessible through their filesystem paths; the `exports` field blocks that access.
- The public API surface is declared via the DI namespaces and type declarations, not via npm exports.

## 3. CLI exception

- A CLI tool may be exposed only through the `"bin"` bridge.

```json
"bin": { "teq-cms": "./bin/teq-cms.mjs" }
```

- CLI entry points must remain `.mjs` and must never be mirrored in an `"exports"` entry.

## 4. Prohibited patterns

- No `"exports"` at the package root.
- No subpath exports such as `"./src/*"` or `"./*"`.
- No combination of `"main"` and `"exports"` in the same package.
- No dual-module configuration that mixes CommonJS and ESM entry points.

## 5. Invariants

- Internal source files must remain accessible for DI-based loading without extra indirection.
- The export surface must stay compatible with the module-resolution expectations in `package.md`, with the typing entry point in `types.md`, and with the publish rules in `publish.md`.
