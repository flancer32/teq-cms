# Publication Code Map

- Path: `ctx/docs/code/publication.md`
- Changed: `20260930`

This map refines the required [publication contract](../architecture/publication.md).

- `src/Back/Config.mjs` projects family and agent-message settings from `TEQ_CMS`. It rejects prefixes beginning with a maintained tmpl locale. Publication source selection consumes tmpl's existing locale configuration.
- `src/Back/Publication/Source.mjs` validates locale, route, path containment, YAML front matter, and Markdown rendering. Exact locale reads and neutral resource selection share these eligibility checks.
- `src/Back/Publication/Catalog.mjs` enumerates configured source families in stable route order for host indexes and discovery. Its `getPresentation()` loads a nonempty family template through tmpl; `listHtml()` filters sources with that same check for HTTP links and discovery. Locale variants retain their source identity; neutral discovery identifies each available publication resource once.
- `src/Back/Publication/Handler.mjs` parses one supported HTTP representation suffix before strict logical-route validation. It produces neutral or exact-locale raw Markdown and localized HTML, resolving neutral `.html` to the maintained tmpl default locale. Suffix aliases reuse extensionless canonical and alternate links through the web handler contract. It is registered at PROCESS stage before template and static handlers and renders the family presentation target through `Fl32_Tmpl_Back_Service_Render$` with the architecture-defined data and links.
- `src/Back/Discovery/Generator.mjs` builds and writes static discovery files through `cms:generate`, using the same source eligibility and selection rules as HTTP representations.
- `src/Back/Cli/Plugin.mjs` registers the publication handler when families are configured.
- `src/Back/Web/Handler/AgentMessage.mjs` receives optional GET contact messages; `src/Back/Agent/Inbox.mjs` saves them outside public `web/`.

The public DI contracts for metadata consumers are `Fl32_Cms_Back_Publication_Source$` and `Fl32_Cms_Back_Publication_Catalog$`. Catalog entries contain source, metadata, Markdown, and derived HTML as separate fields. Tests must cover the six neutral/localized extensionless, `.md`, and `.html` forms, agreement between exact Markdown and presentation input, absent or unmaintained HTML default, alias-independent canonical links and discovery without duplicates, rejection of unsupported or chained suffixes, exact locale HTML, neutral source preference with a non-English tmpl default, absence of both candidate sources, representation availability and links, agreement between discovery and HTTP publication, safe source access, reserved locale prefixes, missing and empty presentations, presentation fallback, the real CMS plugin and web pipeline order, and private inbox boundaries.
