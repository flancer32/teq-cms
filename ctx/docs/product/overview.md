# Product Overview

## Product Identity

TeqCMS is a minimalist file-based CMS for multilingual websites.

## Product Mission

TeqCMS keeps website content, templates, and translation state transparent, reproducible, and version-controlled through files and Git.
The system uses a strict file structure and automation without control panels or databases.

## Product Scope

- Render localized HTML templates from files in `tmpl/`.
- Resolve locale-aware web requests.
- Synchronize localized templates through an OpenAI-compatible API.
- Integrate with a host Node.js application.

## Product Model

- Pages are HTML templates rendered by the server through the selected template engine.
- Request processing extracts locale and path, prepares data, and selects the appropriate template.
- `@flancer32/teq-tmpl` offers template locales, the engine contract, and the
  available engine implementations. TeqCMS owns the final engine selection,
  CMS-specific settings, server composition, and model API parameters.
- Translation state is stored in JSON and synchronized with the file system.

## Product Boundaries

### In Scope

- File-based content and translation state.
- Server-side template rendering.
- CLI-driven operation.
- Websites, landing pages, documentation sites, and developer portals that need transparent version-controlled localization.

### Out of Scope

- Control panels.
- Headless database storage.
- Product behavior changes caused solely by a platform dependency migration.

## Product Invariants

- Content remains inspectable and version-controlled as files.
- Localization must not require manual duplication of every language version.
- The CMS remains an isolated package configured by its host application.
