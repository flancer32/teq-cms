# Project Documentation

- Path: `ctx/docs/AGENTS.md`
- Template Version: `20261024`
- Changed: `20261024`

## Purpose

This directory contains authoritative project declarations and navigation documents.

ADSM defines four ordered declarative levels: product → architecture → environment → code. Lower levels refine upstream meaning without redefining it. Accepted declarations constrain every valid implementation.

An optional Verification Layer relates declarations to bounded observations of reality. It is not a fifth declarative level and does not establish independent authority over project meaning.

## Level Map

- `architecture/` — system structure, behavior, state ownership, and integration boundaries.
- `code/` — implementation constraints and engineering conventions.
- `environment/` — runtime conditions, infrastructure, and deployment constraints.
- `product/` — product meaning, domain, roles, and expected outcomes.
- `AGENTS.md` — documentation boundary and working rules.
- `ai-intro.md` — initial project orientation for agents.
- `filesystem.md` — top-level repository navigation.

Keep this map aligned with the actual project structure. Add optional branches only when adopted.

## Level Boundary

Defines:

- Accepted project declarations and their dependency order.
- Rules for reading, refining, and maintaining declarative knowledge.
- Boundaries between declarations, verification specifications, and supporting materials.

Does NOT define:

- Agent operations and workflows under `ctx/agent/`.
- Executable product artifacts, runtime state, or operational evidence.
- Generic ADSM methodology; use the `adsm-ctx` skill when available.

## Local Reading Map

- For unfamiliar projects, consult `ai-intro.md`.
- For repository topology, consult `filesystem.md` when needed.
- For project declarations, follow the relevant level's `AGENTS.md` and read its task-relevant documents.
- For lower-level changes, consult the upstream declarations needed to establish their meaning and constraints.
- For context lifecycle, validation, audit, compression, or upgrade, use the `adsm-ctx` skill when available.

Avoid unnecessary full-context scans and repeated reading of unchanged documents.

## Documentation Rules

- Preserve the authority order: product → architecture → environment → code. Report missing or conflicting upstream meaning rather than inventing or silently changing it downstream.
- Keep each durable declaration in its appropriate authoritative document. Preserve consistency across dependent levels.
- Ordinary `*.md` documents are agent-facing and written in English by default. Optional `*.skin.<lang>.md` files provide human-facing semantic projections.
- Before editing an agent document, read all matching skins. Preserve their meaning and invariants; report projection drift or required human decisions instead of silently resolving conflicts.
- Keep documents explicit, focused, and maintainable. Preserve meaningful nested structure and do not sacrifice requirements or precision for brevity.
- Keep each declarative level within nine direct directories and nine direct ordinary files where practical, excluding `AGENTS.md` and matching skins. Record intentional excess under `## Documentation Capacity Exception` in that level's `AGENTS.md`.
- Adopt `verification/` only when a durable verification specification exists. Require its root `AGENTS.md` and create primary-target categories only when needed. Add the adopted branch to the Level Map.
- Place verification specifications under their primary declarative targets and link secondary declarations. Keep specifications distinct from actual evidence and operational feedback state. Neither evidence nor assessments may redefine accepted meaning.
- Keep visual, generated, rendered, and auxiliary artifacts under `ctx/assets/**`; they must not introduce authoritative project meaning.
- Maintain `Path` and `Changed` attributes in stable documents. Delegate detailed methodology and lifecycle procedures to the `adsm-ctx` skill.
