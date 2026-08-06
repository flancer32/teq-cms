# JSConfig Environment Rules

Path: `ctx/rules/env/npm/jsconfig.md`

## Purpose

Guarantee that `jsconfig.json` delivers the typing environment and module resolution that TeqCMS relies on, without introducing unnecessary TypeScript surface or conflicting module formats.

## 1. Location

- `jsconfig.json` must exist at the project root and cover every `.js`, `.mjs`, and `.d.ts` file so that the language server can resolve the entire runtime surface described in `types.md` and the package entry points.

## 2. Compiler options

The configuration must include at least these options:

- `"checkJs": true`
- `"module": "es2022"`
- `"target": "es2022"`
- `"moduleResolution": "node"`
- `"strict": true`
- `"allowSyntheticDefaultImports": true`

They define the minimal baseline for JSDoc-driven type checking.

## 3. Includes

The path list must cover every runtime and declaration file:

- `"*.js"`, `"*.mjs"`, `"*.d.ts"`
- `"src/**/*.js"`, `"src/**/*.mjs"`

## 4. Module compatibility

- `jsconfig.json` must remain compatible with `package.json`'s `"type": "module"` entry and the prohibition on `exports` described in `exports.md`.
- Only Node-style ESM resolution is allowed; no CommonJS compatibility layers, emitters, or loader plugins should be configured here.

## 5. Typing constraints

- Typing comes from JSDoc annotations and `.d.ts` files. No `.ts`/`.tsx` sources should be added to the `include` list or anywhere else.
- Avoid TypeScript-specific flags beyond those essential for JSDoc (`checkJs`, `allowSyntheticDefaultImports`, `strict`).

## 6. Invariants

- The JSConfig must not contradict the typing entry point (`types.md`) or the typing delivery rules defined in `package.md`.
- Keep the configuration in sync with the dependency-injection expectations from `ctx/rules/arch/di/*` so that the language server understands how modules are resolved at runtime.
