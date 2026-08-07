# TeqCMS Verification

Use the smallest relevant check set, then run the full project checks for
changes crossing package boundaries.

## Required checks

```text
npm test
teqfw-esm-validator src --profile base
git diff --check
npm pack --dry-run
```

The pre-DI host configurator is intentionally excluded from the ESM validator;
the validator target remains `src/`.

## Runtime smoke check

Start the application through the package script or the local CLI executable,
then request `/` and a localized page such as `/en/index.html`. Confirm that
the root redirects to the default locale, the localized response is successful,
and the rendered page contains the expected locale links.

When validating template-root behavior, omit `TEQFW_TMPL__ROOT_PATH`: the
application root must come from `TeqFw_Cli_Config$.applicationRoot`.

For package publication, inspect the `npm pack --dry-run` file list and confirm
that `skills/teqfw-cms/SKILL.md` and its references are present while `test/`
and `ctx/` remain excluded.
