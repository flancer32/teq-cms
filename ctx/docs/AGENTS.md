# Project Documentation

- Path: `ctx/docs/AGENTS.md`
- Template Version: `20260702`
- Changed: `20260807`

## Purpose

This branch holds project-facing documentation.

The installed template should describe the project, not restate detailed ADSM methodology.

## Bootstrap Marker

- This documentation baseline follows ADSM conventions.
- Use skill `adsm-ctx` for structure validation, document-shape discipline, and methodology.

## Level Map

- `architecture/` — project architecture documents.
- `code/` — code-level constraints and testing guidance.
- `environment/` — runtime and infrastructure assumptions.
- `product/` — product meaning, roles, and use cases.
- `AGENTS.md` — entry note for `ctx/docs/`.
- `ai-intro.md` — compact agent orientation for the concrete project.
- `filesystem.md` — top-level repository map.

## Level Boundary

Defines:

- The declarative documentation boundary for the project.
- The documentation dependency chain from product to code.
- The local entry points used to orient agents within `ctx/docs/`.

Does NOT define:

- Project-local agent operations under `ctx/agent/`.
- Product source files or runtime assets outside documentation.
- Detailed ADSM methodology beyond the bootstrap routing marker.

## Documentation Rules

- Use explicit line breaks to keep each durable statement easy to scan.
- Use section separators only where they improve navigation or clarify a level boundary.
- Keep documents compact and avoid long uninterrupted blocks of text.
- Keep project-facing documents below `5,000` tokens unless a longer document preserves a load-bearing distinction.
- Treat ordinary `*.md` files as agent-facing operational context documents.
- Treat `*.skin.md` files as human-facing semantic skins for matching agent documents with the same basename and directory.
- Read a matching skin before changing an agent document.
- Report a human decision if a requested agent-document change would violate the matching skin.
- Keep project-specific nested subdirectories inside `product/`, `architecture/`, `environment/`, and `code/` when they improve maintainability.
- Keep each documentation level to no more than nine direct directories and nine direct ordinary files, excluding `AGENTS.md` and paired `*.skin.md` files, where practical.
- Put visual, generated, rendered, or auxiliary artifacts under `ctx/assets/`.
