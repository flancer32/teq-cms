# NPM Environment Documentation

- Path: `ctx/docs/environment/npm/AGENTS.md`

## Purpose

This branch defines npm configuration, module typing, publishing, and package metadata constraints.

## Document Map

- `exports.md` — ESM module access and export restrictions.
- `jsconfig.md` — JSDoc typing and Node ESM resolution.
- `package.md` — package metadata, dependencies, and layout invariants.
- `publish.md` — npm payload and publishing constraints.
- `types.md` — declaration entry point and typing rules.

## Local Rules

- Preserve the ESM-only package contract.
- Keep JSDoc and `.d.ts` as the typing mechanism; do not introduce TypeScript sources or build generation.
- Keep package metadata consistent with DI namespace loading and the CLI host.
- Read all documents in this directory before changing a shared npm invariant.
