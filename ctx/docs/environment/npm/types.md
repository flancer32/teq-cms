# Type Declaration Rules

## Source Restrictions

The project contains no TypeScript source files.
Type declarations are delivered through `.d.ts` files and JSDoc comments in `.mjs` sources.

## Entry Point

`package.json` defines:

```json
"types": "./types.d.ts"
```

`types.d.ts` lives in the package root and presents the canonical ambient type
map for the configured `Fl32_Cms_` namespace. It is loaded together with the
source and type maps of TeqFW dependencies by `jsconfig.json`.

## Resolution and Syntax

TypeScript declaration syntax is allowed only in `.d.ts` files.
Declarations must not redefine Node.js built-in types or DI namespaces.
Resolution follows the root `jsconfig.json` with NodeNext module and module
resolution semantics.

Each namespace-addressed runtime module has one deterministic instance alias
in `types.d.ts`; class exports also have a matching `__Class` constructor alias.
JSDoc uses these aliases without CDC lifecycle suffixes such as `$`.

## Prohibited Patterns

- No automated declaration generation.
- No `tsc` build step.
- No declaration files that mirror private source modules as public entry points.
