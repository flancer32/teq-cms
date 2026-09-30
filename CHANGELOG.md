# Changelog

## [Unreleased]

## [0.10.0] - 2026-09-30

### Added

- Sitemap representation selection through `TEQ_CMS__SITEMAP_REPRESENTATIONS`: HTML (default), Markdown, or both, with every distinct eligible source language, canonical alias deduplication, and Markdown discovery independent of HTML availability (issue #33).
- Optional boolean publication `indexable` metadata to exclude sources from generated discovery while retaining public routing.
- Shared catalog representation inventory and real CLI/HTTP discovery tests with XML parsing, deterministic generation, and canonical/alternate checks.
- Shared CMS 404 responses and a terminal PROCESS handler, with optional localized
  host `404.html` templates, a replaceable DI presentation policy, safe template data,
  non-HTML Markdown/API/static errors, HEAD support, and no-store/noindex headers.
- Real CLI HTTP coverage and consumer guidance for branded missing pages.
- Publish root-level and nested Markdown across the public `tmpl/web/` tree by default without family registration (issue #31).
- Add a replaceable host DI policy for publication mode, presentation names, and static-only URL prefixes; keep deployment settings separate from route policy.
- Support unlocalized neutral sources and root index publication with canonical `/` and localized `/{locale}/` links.

### Changed

- Use Markdown, ordinary templates, then `web/` static files, then 404; found invalid Markdown does not fall through to legacy HTML.
- Deliver static exclusions and discovery files directly through the standard web static handler, terminating missing files with 404.
- Retain nonempty `PUBLICATION_FAMILIES` as legacy compatibility mode; reject explicit site policy combined with legacy families.
- Extend ordinary template-name lookup to requested, default, and unlocalized template trees.
- Update context, usage documentation, and consumer skill with host policy composition and migration guidance.

### Fixed

- Select HTML language by explicit URL locale, then supported weighted Accept-Language, then tmpl default, including neutral `.html`; preserve unlocalized source priority and stable neutral Markdown, and vary caches by language.
- Separate Markdown source priority from response format: explicit `.md`/`.html` overrides headers; extensionless publication URLs use Accept, then User-Agent hints, returning Markdown to agents and HTML to people with cache variation.
- Use explicit `.md` URLs for Markdown alternates and llms.txt, including `/index.md` for home; include available unlocalized HTML in sitemap.xml.

### Verification

- Cover site-wide URL forms, exact sources, root priority, host-selected presentations, static exclusions, safety, canonical discovery, and real CLI DI policy substitution.

## [0.9.1] - 2026-09-30

### Fixed

- Restore `.html` publication addresses under configured family prefixes (issue #30). Support all neutral and localized extensionless, `.md`, and `.html` forms while preserving extensionless canonical links and discovery without duplicate aliases.
- Serve localized `.md` from the exact requested source and neutral `.md` with the existing `en` then tmpl default preference. Neutral `.html` renders only the maintained tmpl default locale source; unavailable sources or presentations return 404.
- Preserve strict logical-route validation, traversal protection, and source-file containment when resolving representation suffixes.

### Documentation and verification

- Document the URL matrix, default-locale HTML policy, source availability, and canonical aliases in the cognitive context, usage guide, README, and consumer skill.
- Cover the full representation matrix, host presentation input, canonical links, discovery without aliases, and unsafe suffix rejection with regression tests (issue #30).

## [0.9.0] - 2026-09-30

### Changed

- Changed publication URLs: `/{prefix}/{route}` serves raw Markdown, preferring `en` then the tmpl default locale; localized URLs serve exact-locale HTML.
- Removed `TEQ_CMS__PUBLICATION_MACHINE_LOCALES` and its configuration accessor. Hosts must replace localized Markdown links with neutral resource links and regenerate discovery files.
- Discovery now lists neutral resources once in `llms.txt` and available localized HTML in the sitemap; presentation links describe only available representations.
- Agents maintain translated source files directly. TeqCMS has no translation command or LLM API integration.
- Clarified the product mission throughout the cognitive context, README, publication guide, consumer skill, and npm description: agents work directly with version-controlled Markdown as primary content, while human-facing HTML is its derived presentation.

### Fixed

- Reject publication prefixes starting with maintained locale codes to prevent URL collisions.
- Share presentation-template availability between HTTP, HTML alternates, and the sitemap; missing or empty templates leave neutral Markdown available.
- Treat unreadable or malformed public source variants as unavailable, preserving neutral source fallback and omitting invalid variants from discovery.
- Reject source symlink aliases and paths outside the configured source tree.
- Align process-host documentation with CLI-owned configuration Sources and application-root resolution.

### Verification

- Expand regression coverage for neutral source preference, unavailable variants, presentation fallback, discovery consistency, reserved locale prefixes, and the real CLI host path.

## [0.8.0] - 2026-09-26

- Raised the minimum `@teqfw/cli` dependency to `2.4.0`, which introduced declarative host Container policy configuration.
- Added opt-in Markdown publication families with localized HTML, explicit machine-locale Markdown, and deterministic `/llms.txt` discovery.
- Extended `cms:translate` to validate and translate opted-in Markdown while preserving its structural syntax.
- Updated the standalone CLI host preprocessor declaration for the installed TeqFW contracts.

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
