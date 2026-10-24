# Cognitive Context

- Path: `ctx/AGENTS.md`
- Template Version: `20261024`
- Changed: `20261024`

## Purpose

This directory contains the project's cognitive context.

`docs/` holds authoritative project definitions, `agent/` holds project-local agent operations, and `assets/` holds non-authoritative supporting materials.

Keep generic ADSM methodology outside the project context.

## Level Map

- `agent/` — project-local agent and tool materials.
- `assets/` — visual, generated, and auxiliary documentation assets.
- `docs/` — authoritative project documentation and constraints.
- `AGENTS.md` — context boundary and navigation rules.
- `README.md` — introductory context information.
- `adsm.json` — context metadata and versioning.

## Level Boundary

Defines:

- The boundary of the project's cognitive context.
- Separation of authoritative documentation, agent operations, and supporting assets.
- Navigation to the appropriate context branch.

Does NOT define:

- Product, architecture, environment, or code meaning; these belong under `docs/`.
- Project-local agent workflows; these belong under `agent/`.
- Generic ADSM methodology; use the `adsm-ctx` skill when available.

## Local Reading Map

- For initial project orientation, read `docs/ai-intro.md` when needed.
- For repository topology, consult `docs/filesystem.md`.
- For product, architecture, environment, or code work, follow `docs/AGENTS.md` and read only task-relevant documentation.
- For project-local agent operations, follow `agent/AGENTS.md`.
- For context lifecycle work, use the `adsm-ctx` skill when available.

Read `README.md` only when additional orientation is needed. Avoid rereading unchanged context within a session.
