# Type Declaration Rules

Path: `ctx/rules/env/npm/types.md`

## Purpose

Stipulate how TeqCMS and related TeqFW packages deliver type information while remaining strictly JavaScript-first.

## 1. Source restrictions

- The project must not contain TypeScript source files (`.ts`, `.tsx`).
- Type declarations are delivered only through `.d.ts` files and JSDoc comments embedded in `.js`/`.mjs` sources.

## 2. Entry point requirement

- `package.json` must define:

```json
"types": "./types.d.ts"
```

- `types.d.ts` must live in the package root and present the complete public type surface.

## 3. Allowed syntax inside `.d.ts`

- TypeScript syntax (interfaces, type aliases, module augmentations, generics, unions, intersections, readonly modifiers, etc.) is allowed only in `.d.ts` files.
- These declarations describe the surface the DI container exposes to consumers.

## 4. Resolution rules

- Declaration files must not overlap with Node.js built-in type names or redefine DI namespaces.
- Resolution must follow the `jsconfig.json` configuration in this directory so that editors and compilers view the same module graph.

## 5. Prohibited patterns

- No automated generation of `.d.ts` files or use of the `tsc` compiler during build or development.
- `.d.ts` files must not mirror the internal source directory structure or expose private modules as public.

## 6. Invariants

- Type declarations must remain compatible with the ESM-only scope maintained in `package.md` and `exports.md`.
- They must align with the typing baseline in `jsconfig.md` and the DI module-loading model from `ctx/rules/arch/di/*`.
