# Code Verification

- Path: `ctx/docs/code/verification.md`
- Changed: `20260923`

The current project checks are:

- `npm run test:unit` — unit tests.
- `npm run test:accept` — acceptance tests.
- `npm test` — unit and acceptance tests through the built-in Node.js test runner.
- `npm run typecheck` — JavaScript type checking for the
  runtime, package type map, and linked TeqFW dependency contracts.
- `npm run validate:esm` — structural validation of TeqFW
  ESM modules under `src/`.
- `teqfw-platform .` — source-to-unit-test topology validation.
- `adsm-ctx adsm-ctx:validate .` — cognitive-context structure validation.

Publication acceptance tests exercise the CMS plugin with the real web pipeline and three localized source files. A local `web:start` smoke check can verify the CLI host, template engine, static delivery, and HTTP content types when sockets are available.
