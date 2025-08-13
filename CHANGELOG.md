# Changelog

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
