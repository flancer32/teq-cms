# Code Verification

The current project checks are:

- `npm run test:unit` — unit tests.
- `npm run test:accept` — acceptance tests.
- `npm test` — unit and acceptance tests through the built-in Node.js test runner.
- `npm run typecheck` — JavaScript type checking for the
  runtime, package type map, and linked TeqFW dependency contracts.
- `npm run validate:esm` — structural validation of TeqFW
  ESM modules under `src/`.

During the dependency-switch checkpoint, failures are recorded and classified rather than repaired.
The later recovery phase must add or restore a reproducible type-check command and update tests for the new TeqFW contracts.
