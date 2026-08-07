# Cognitive Context

- Path: `ctx/AGENTS.md`
- Template Version: `20260702`
- Changed: `20260807`

## Purpose

This file marks `ctx/` as the project cognitive context.

Use this branch for project knowledge and keep detailed ADSM methodology outside the project-facing context.

## Bootstrap Marker

- This context follows ADSM conventions.
- Use skill `adsm-ctx` for structure validation, upgrade logic, and methodology rules.

## Level Map

- `agent/` — project-local agent and tool materials outside the reusable ADSM baseline.
- `assets/` — visual, generated, rendered, or auxiliary artifacts that support documentation without defining authoritative meaning.
- `docs/` — project-facing documentation and constraints.
- `AGENTS.md` — level definition for `ctx/`.
- `README.md` — short entry note for the cognitive context.
- `adsm.json` — context metadata for versioning and upgrade eligibility.

## Level Boundary

Defines:

- `ctx/` as the project cognitive context boundary.
- The split between project-facing documentation and project-local agent materials.
- The local entry points agents should read before deeper work.

Does NOT define:

- Product-specific meaning that belongs in subordinate product and architecture documents.
- Implementation structure outside the cognitive context.
- Detailed ADSM methodology that belongs to the skill and its references.

## Local Reading Map

- Read `README.md` for a short entry note.
- Read `docs/filesystem.md` for the top-level repository map.
- Read `docs/` for project documentation.
