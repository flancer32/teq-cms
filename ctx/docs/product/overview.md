# Product Overview

- Path: `ctx/docs/product/overview.md`
- Changed: `20260926`

## Product Identity

TeqCMS is an agent-first, file-based CMS for multilingual web applications.

## Product Mission

TeqCMS lets agents build and maintain web applications for other agents first and for people second. Markdown is the primary authored format for content that agents read; the CMS projects it to HTML for human readers. Content and locale variants remain transparent, reproducible, and version-controlled through files and Git, without a control panel or database.

## Product Scope

- Publish Markdown source for agents and render localized HTML projections for people.
- Resolve locale-aware web requests and continue to support existing HTML templates.
- Let agents author and translate locale-specific files directly, without an LLM API translation service in the CMS.
- Generate `robots.txt`, `llms.txt`, and `sitemap.xml` from the maintained publication corpus through CLI commands where the source data allows it.
- Provide a standard GET request path for an agent to send a bounded message to the site owner.
- Integrate with a host Node.js application.

## Product Model

- Markdown files are authored sources. Their HTML projections are derived pages rendered by the server; HTML templates remain supported for layout and existing pages.
- Request processing extracts locale and path, prepares data, and selects the appropriate template.
- The host selects the template engine and supplies the website's templates.
  TeqCMS owns CMS-specific publication and communication settings.
- Agents maintain translations as files in locale-specific template zones. The CMS does not call an LLM or track translation state in a database.
- The CMS exposes only public Markdown sources through agent-readable routes and generated discovery files; private files and prompt sidecars are outside the publication corpus.

## Product Boundaries

### In Scope

- File-based Markdown, HTML projections, and agent-authored locale variants.
- Server-side template rendering.
- CLI-driven generation of standard discovery files.
- A bounded agent-to-owner message path with a site-owned delivery or inbox policy.
- Agent-facing web applications, documentation sites, developer portals, and human-facing websites built from version-controlled content.

### Out of Scope

- Control panels.
- Headless database storage.
- CMS-managed LLM API translation and automatic translation jobs.
- Product behavior changes caused solely by a platform dependency migration.

## Product Invariants

- Content remains inspectable and version-controlled as files.
- Each public locale variant is an explicit, reviewable authored file. Agents may produce those variants.
- The CMS remains an isolated package configured by its host application.
- Markdown publication and source exposure follow explicit host configuration. Existing HTML routes keep their behavior.
- Generated discovery lists only public, valid sources; an agent message never exposes its content in public output or logs.
