# Product Overview

- Path: `ctx/docs/product/overview.md`
- Changed: `20260930`

## Product Identity

TeqCMS is a CMS built around agents and Markdown for multilingual web applications.

## Product Mission

TeqCMS is a CMS built around agents and Markdown. Agents work directly with version-controlled Markdown content: reading it, creating it, maintaining it, and translating it. Human-facing web pages are projections of that content rather than its primary form.

Content and locale variants remain transparent, reproducible, and version-controlled through files and Git, without a control panel or database.

## Product Scope

- Publish Markdown source for agents and render localized HTML projections for people.
- Resolve locale-aware web requests and continue to support existing HTML templates.
- Let agents author and translate locale-specific files directly, without an LLM API translation service in the CMS.
- Generate `robots.txt`, `llms.txt`, and `sitemap.xml` from the maintained publication corpus through CLI commands where the source data allows it.
- Provide a standard GET request path for an agent to send a bounded message to the site owner.
- Integrate with a host Node.js application.

## Product Model

- Markdown files are authored sources. Their HTML projections are derived pages rendered by the server; HTML templates remain supported for layout and existing pages.
- A publication is one content resource with explicit locale-specific Markdown sources. Locale selects content language; representation selects Markdown or HTML.
- Localized publication URLs expose human-facing HTML projections; the locale-neutral URL is the canonical agent-facing Markdown resource. These representations are determined by the URL, independently of the client.
- The locale-neutral resource prefers an English (`en`) source, then the site's default locale source. If neither exists, that resource is unavailable; no other locale is substituted. English need not be the default locale for human pages.
- Localized HTML requires the source for the requested locale; another language does not substitute for a missing variant.
- The host selects the template engine and supplies the website's templates.
  TeqCMS owns CMS-specific publication and communication settings.
- Agents create and maintain translations as ordinary version-controlled, locale-specific Markdown files. The CMS does not call an LLM API, run automatic translation jobs, or store translation state.
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
- Markdown is the primary authored content form; human-facing HTML is its derived presentation.
- Each public locale variant, including a translation, is an explicit, reviewable Markdown file maintained in version control.
- The CMS remains an isolated package configured by its host application.
- Publication families require explicit host configuration. Existing non-publication HTML template routes keep their behavior.
- Generated discovery lists only public, valid sources; an agent message never exposes its content in public output or logs.
