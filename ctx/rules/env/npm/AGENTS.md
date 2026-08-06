# NPM Environment Rules - Entry Point

Path: `ctx/rules/env/npm/AGENTS.md`

## Purpose

Define the shared context for npm configuration and distribution rules that govern TeqCMS and other TeqFW packages.

## Scope

This directory captures every invariant that touches npm exports, module typing, package descriptors, publishing, and the typing environment that LLM agents must preserve without change of intent.

## Document Map

- `exports.md` - ES module export rules and limitations.
- `jsconfig.md` - root `jsconfig.json` setup for JSDoc typing and Node ESM resolution.
- `package.md` - `package.json` metadata, dependencies, and structural invariants.
- `publish.md` - criteria for what may be shipped in the npm bundle.
- `types.md` - `.d.ts` entry point and typing rules tied to JSDoc.

## Agent Instructions

- Study every document in this directory before modifying any single file so that shared invariants remain aligned.
- Preserve the ESM-only stance: no CommonJS sources, no dual-module configuration, and the `package.json` `"type"` field must stay set to `module` in all edits.
- Keep the typing story anchored on JSDoc + `.d.ts` files; do not introduce or rely on `.ts`/`.tsx` sources or generation steps.
- Maintain compatibility with TeqFW dependency injection, namespace, and module-resolution expectations documented under `ctx/rules/arch/`.
- Avoid adding imperatives or procedural instructions; new text must stay declarative and only restate existing requirements in clearer form, adding precise cross-references where it improves cohesion.
