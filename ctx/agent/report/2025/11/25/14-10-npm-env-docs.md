# NPM Environment Documentation Update

## Goal

- Raise the quality of every file under `ctx/rules/env/npm/` so the npm-related rules satisfy the declarative, complete, connected, dense, compact, and non-redundant criteria requested by the human while preserving their original semantics.

## Problems Found

1. The existing documents mixed inconsistent styles, repeated general statements, and lacked explicit cross-references to neighbor rules, which weakened declarative clarity.
2. Individual rules sometimes implied but did not state their relationship to related files (e.g., package metadata vs. exports/typing constraints), creating subtle ambiguity for future edits.
3. The directory lacked a unified entrypoint summary that emphasized shared invariants and the need to read all files together before changing them.

## Improvements

1. Rewrote `AGENTS.md` to capture the entire directory scope, provide a coherent map, and call out shared invariants in a declarative manner.
2. Reorganized `package.md`, `jsconfig.md`, `exports.md`, `types.md`, and `publish.md` to follow consistent section structures, include precise cross-references, and remove redundant phrasing while keeping every technical requirement untouched.
3. Ensured typing, export, CLI, dependency, and publishing invariants explicitly mention their neighbors so the docs form a cohesive rule set rather than isolated notes.

## Artifacts

- Updated `ctx/rules/env/npm/{AGENTS.md, package.md, jsconfig.md, exports.md, types.md, publish.md}`
