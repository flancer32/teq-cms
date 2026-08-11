# Changelog

## [0.7.0] - 2026-08-11

- Migrated the web runtime from `@flancer32/teq-web` to `@teqfw/web` 2.x.
- Renamed web DI tokens from `Fl32_Web_` to `TeqFw_Web_` and the server command to `web:start`.


## [0.6.1] - 2026-08-08

- Switched `@flancer32/teq-tmpl` and `@teqfw/web` to npm registry dependencies with `<=1.0.0` ranges.

## [0.6.0] - 2026-08-07

- Updated TeqFW runtime dependencies to npm releases with compatible `>=` ranges.
- Added the human-facing README promotion and Agent Skill guidance.
- Added package type checking and TeqFW ESM validation scripts.
- Added unit coverage for CMS components and aligned CLI composition with the current TeqFW host model.

## [0.5.4] - 2025-11-25

- Added external DI configuration support (`teqcms.config.mjs` / `teqcms.config.js` and `"teqcms.configure"` in `package.json`).
- Refactored CLI composition root (`bin/teq-cms.mjs`): unified namespace setup, Replace preprocessor pipeline, engine selection, safe dynamic imports, and strict root detection.
- Introduced project context structure (`ctx/`) with ADSM documentation.
- Cleaned up extra directories during npm publication in GitHub Actions.
- Improved project root detection by traversing parent directories when searching for `node_modules`.

## [0.5.3] - 2025-08-13

- Fixed project root detection to traverse parent directories when searching for `node_modules`.

## [0.5.2] - 2025-07-04

- Implemented auto-continue for long LLM translations.
- Fixed ESLint issues.

## [0.5.1] - 2025-06-27

- Fix an error with the configuration of the static file handler.
- Updated acceptance tests for Web CLI command.

## [0.5.0] - 2025-06-26

- Added CLI command to run TeqCMS as a web server.
- Fixed static handler initialization and updated dependencies.

## [0.4.0] - 2025-06-18

- Added base URL configuration for generating canonical links.
- Added canonical and alternate link tags for localized pages.

## [0.3.0] - 2025-06-18

- Added canonical and alternate link tags for localized pages using schemeless URLs.
- Refactored routing logic into helpers and added unit tests.
- Fixed template resolution to ignore directories.

## [0.2.0] - 2025-06-17

- Centralized web server configuration via `Fl32_Cms_Back_Config`.
- Added CLI defaults and sample `.env` with server and AI settings.
- Removed direct environment access from the config service.

## [0.1.0] - 2025-06-17

- Initial release
