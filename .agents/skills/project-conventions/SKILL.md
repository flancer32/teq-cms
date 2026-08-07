---
name: project-conventions
description: Project-specific conventions for every task in the TeqCMS repository.
---

# Project Conventions

`AGENTS.md` overrides this file when the instructions conflict.

## Repositories

- `root` and `ctx` are one Git repository: `flancer32/teq-cms`. Do not treat them as separate worktrees, commits, or pushes.
- `ctx/` is the authoritative ADSM cognitive context; preserve its product, architecture, environment, and code meaning.

## Workflow

- Work in the repository's `main` branch. This project rule overrides any GitHub-skill instruction to use a separate branch.
- At the start of work, inspect `git status --short --branch`, `git worktree list`, and the applicable `AGENTS.md` files. Check upstream state in the root repository; `ctx` has no separate repository state.
- If local `main` is behind upstream and the worktree is clean, synchronize it with a safe fast-forward only. Never discard or overwrite existing local changes to synchronize it.
- Before changing files, inspect the affected source, tests, package metadata, and relevant `ctx/docs` or legacy context documents.
- Do not commit or push unless the user explicitly requests it.
- Do not create external issues, messages, releases, or other external state without explicit authorization. Ask the user when a missing decision would change behavior or grant external authority.

## Communication

- Communicate with the user in Russian.
- Write source code, comments, documentation, commit messages, and identifiers in English.
- Report changed files, verification results, and remaining risks in the final response.

## Project boundaries

- `src/` contains the TeqCMS runtime implementation. Runtime source files use native ESM and the `.mjs` extension.
- `@teqfw/cli` is the Node.js CLI composition root. Keep namespace metadata, host configurator, configuration loading, preprocessors, and command lifecycle integration in the package boundaries expected by `teq` rather than in business components.
- `test/` contains unit and acceptance tests. Test composition must use explicit DI tokens and mocks appropriate to the tested boundary.
- TeqFW components declare dependencies through `__deps__` and resolve platform services through DI tokens. Use `@teqfw/di`, `@teqfw/cfg`, `@teqfw/log`, `@teqfw/cli`, `@flancer32/teq-tmpl`, and `@flancer32/teq-web` according to their installed contracts; do not recreate package-owned platform services inside TeqCMS.
- Keep application configuration in the `@teqfw/cfg` reader boundary and application composition in the CLI root. Use `TeqFw_Log_Provider` for logging.
- Preserve `@LLM-DOC` comments exactly. Do not modify, delete, or infer rules from historical files under `ctx/agent/report/`.
- Do not add production dependencies without explaining the need. Ignore `output.md` files and do not treat `node_modules/` as project context.

## Validation

- Run `npm test` for product changes. It covers unit and acceptance tests through the built-in Node.js test runner.
- Run `teqfw-esm-validator src --profile base` for changes to TeqFW ESM modules, DI metadata, or source layout. Validate `src/`, not `node_modules/` or linked package skills.
- Run `git diff --check` before handoff.
- When a platform package API or version matters, inspect the installed package source, metadata, tests, and linked skill under `.agents/skills/` before relying on it.
- Treat validator errors and test failures as blocking. Eslint warnings must be reported separately from errors.

## Shared memory

- `flancer32/ai-memo` is the shared cross-project issue tracker and memory.
- Issue source: `flancer32/teq-cms`; expected resolver: `flancer32/teq-cms`. Every issue must name the project or projects expected to resolve it.
- In multiline text sent to GitHub, use actual line breaks; never send literal `\n`, which GitHub displays as text.
- When referring to a commit in another repository, use its full GitHub URL: `https://github.com/vendor/name/commit/<sha>`.
- Notes for this project use `project/flancer32/teq-cms/`.
- Do not perform automatic issue, commit, or push actions without explicit project policy or user authorization.
