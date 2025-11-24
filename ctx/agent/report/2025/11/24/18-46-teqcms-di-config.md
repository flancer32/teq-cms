# teqcms-di-config

- **Goal:** Allow TeqCMS to load external DI configuration from `teqcms.config.js` or the `"teqcms"` section of `package.json` and invoke it before executing CLI commands.
- **Actions:** detected both configuration sources inside `bin/teq-cms.js`, implemented safe dynamic import and validation, and wired the configurator call between namespace setup and the CLI execution; documented the extension mechanism with examples in `README.md`.
- **Artifacts:** `bin/teq-cms.js`, `README.md`
