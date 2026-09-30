# TeqCMS Verification

Use the smallest relevant check set, then run the full project checks for
changes crossing package boundaries.

## Required checks

```text
npm test
npm run typecheck
teqfw-esm-validator src --profile base
git diff --check
npm pack --dry-run
```

The pre-DI host configurator is intentionally excluded from the ESM validator;
the validator target remains `src/`.

## Runtime smoke check

Start the application through the package script or the local CLI executable,
then request `/` and a localized page such as `/en/index.html`. Confirm that
the root follows the host source hierarchy (Markdown, ordinary template, static,
404), the localized response is successful, and the page contains expected locale
links. Test unknown localized and neutral URLs with the optional host 404 templates,
explicit Markdown and static misses, HEAD, and missing/broken error templates.
The real CLI HTTP acceptance test requires permission to bind a loopback socket.

When validating template-root behavior, omit `TEQFW_TMPL__ROOT_PATH`: the
application root must come from `TeqFw_Cli_Config$.applicationRoot`.

For package publication, inspect the `npm pack --dry-run` file list and confirm
that `skills/teqfw-cms/SKILL.md` and its references are present while `test/`
and `ctx/` remain excluded.
