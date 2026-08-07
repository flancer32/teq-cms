# Dependency Migration Checklist

- Verify `package.json` and `package-lock.json` contain the selected versions.
- Verify `npm ls --depth=0` resolves the direct dependency graph.
- Record the first CLI bootstrap failure.
- Record missing or changed APIs in DI, web, template, logging, configuration, and CLI packages.
- Do not repair runtime behavior in the dependency-switch checkpoint.
- Run the recovery plan only after the broken checkpoint is documented.
