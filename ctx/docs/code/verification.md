# Code Verification

- Path: `ctx/docs/code/verification.md`
- Changed: `20260926`

The current project checks are:

- `npm run test:unit` — unit tests.
- `npm run test:accept` — acceptance tests.
- `npm test` — unit and acceptance tests through the built-in Node.js test runner.
- `npm run typecheck` — JavaScript type checking for the
  runtime, package type map, and linked TeqFW dependency contracts.
- `npm run validate:esm` — structural validation of TeqFW
  ESM modules under `src/`.
- `teqfw-platform .` — source-to-unit-test topology validation.
- `adsm-ctx validate .` — cognitive-context structure validation.

Publication and agent-message acceptance tests exercise the CMS plugin with the real web pipeline. Generator unit tests verify discovery output and refusal to replace symlink targets. A local `web:start` smoke check can verify the CLI host, template engine, static delivery, and HTTP content types when sockets are available.
