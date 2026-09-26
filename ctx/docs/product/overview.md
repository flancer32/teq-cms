# Product Overview

- Path: `ctx/docs/product/overview.md`
- Changed: `20260923`

## Product Identity

TeqCMS is a minimalist file-based CMS for multilingual websites.

## Product Mission

TeqCMS keeps website content, templates, and translation state transparent, reproducible, and version-controlled through files and Git.
The system uses a strict file structure and automation without control panels or databases.

## Product Scope

- Render localized HTML templates from files in `tmpl/`.
- Resolve locale-aware web requests.
- Synchronize localized templates through an OpenAI-compatible API.
- Publish explicitly opted-in Markdown families as localized HTML and a restricted machine-readable corpus.
- Integrate with a host Node.js application.

## Product Model

- Pages are HTML templates rendered by the server through the selected template engine.
- Request processing extracts locale and path, prepares data, and selects the appropriate template.
- The host selects the template engine and supplies the website's templates.
  TeqCMS owns CMS-specific settings and model API parameters.
- Translation state is stored in JSON and synchronized with the file system.
- Markdown remains the authored source. Human visitors receive server-rendered HTML through a host-owned presentation template. Agents may receive original Markdown only in configured machine-readable locales. Discovery projects only authorized source routes.

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
- Markdown publication is disabled until a host configures a publication family. Existing HTML routes keep their behavior.
