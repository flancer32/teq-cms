# Iteration Report

## Goal
- Update TeqCMS configurator guidance so both `.mjs` and `.js` files are considered, with preference for `.mjs`, and ensure the CLI loader follows the same logic.

## Actions
- expanded `ctx/rules/arch/bin/teq-cms.md` to explain the `.mjs`/`.js` configuration fallbacks and recommend `.mjs` when available.
- taught `bin/teq-cms.mjs` to search for `teqcms.config.mjs` ahead of `teqcms.config.js` when resolving the configurator.

## Resulting Artifacts
- `ctx/rules/arch/bin/teq-cms.md`
- `bin/teq-cms.mjs`
