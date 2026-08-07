# Filesystem Structure

- Path: `ctx/docs/filesystem.md`
- Changed: `20260807`

## Purpose

Defines the declarative structure of the project repository at the top level only.

## Root Directories

- `.agents/` — project-local skills linked from installed TeqFW packages and project-owned skills.
- `skills/` — the package-owned consumer skill distributed with the npm package.
- `ctx/` — cognitive context containing project documentation and project-local agent materials.
- `src/` — CMS runtime implementation.
- `test/` — unit and acceptance tests.
- `tmpl/` — sample website templates.
- `web/` — static web assets.

## Root Files

- `AGENTS.md` — repository instructions.
- `README.md` — human project overview.
- `package.json` — package metadata and dependency graph.
- `package-lock.json` — resolved npm dependency graph.
- `types.d.ts` — package type aliases.
- `jsconfig.json` — JavaScript checking configuration.

## Scope Rule

This document describes only top-level directories and root-level files.
Lower-level structure is described by the corresponding `AGENTS.md` files.

## Boundary Definition

The `ctx/` directory governs interpretation of the product and its implementation.
The `node_modules/` directory and generated caches are not project context.
