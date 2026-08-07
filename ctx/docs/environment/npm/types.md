# Type Declaration Rules

## Source Restrictions

The project contains no TypeScript source files.
Type declarations are delivered through `.d.ts` files and JSDoc comments in `.mjs` sources.

## Entry Point

`package.json` defines:

```json
"types": "./types.d.ts"
```

`types.d.ts` lives in the package root and presents the public type surface.

## Resolution and Syntax

TypeScript declaration syntax is allowed only in `.d.ts` files.
Declarations must not redefine Node.js built-in types or DI namespaces.
Resolution follows the root `jsconfig.json`.

## Prohibited Patterns

- No automated declaration generation.
- No `tsc` build step.
- No declaration files that mirror private source modules as public entry points.
