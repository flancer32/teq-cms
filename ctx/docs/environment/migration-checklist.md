# Dependency Migration Checklist (Historical)

- Path: `ctx/docs/environment/migration-checklist.md`
- Changed: `20260923`

This checklist records the completed dependency-switch checkpoint. Current verification commands are in `../code/verification.md`.

- Verify `package.json` and `package-lock.json` contain the selected versions.
- Verify `npm ls --depth=0` resolves the direct dependency graph.
- Record the first CLI bootstrap failure.
- Record missing or changed APIs in DI, web, template, logging, configuration, and CLI packages.
- Do not repair runtime behavior in the dependency-switch checkpoint.
- Run the recovery plan only after the broken checkpoint is documented.
