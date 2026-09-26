# Publication Code Map

- Path: `ctx/docs/code/publication.md`
- Changed: `20260926`

- `src/Back/Config.mjs` projects family, machine locale, and agent-message settings from `TEQ_CMS`.
- `src/Back/Publication/Source.mjs` validates locale, route, path containment, YAML front matter, and Markdown rendering.
- `src/Back/Publication/Catalog.mjs` enumerates configured source families in stable route order for host indexes and discovery.
- `src/Back/Publication/Handler.mjs` produces HTML and authorized Markdown through the web handler contract.
- `src/Back/Discovery/Generator.mjs` builds and writes static discovery files through `cms:generate`.
- `src/Back/Cli/Plugin.mjs` registers the publication handler when families are configured.
- `src/Back/Web/Handler/AgentMessage.mjs` receives optional GET contact messages; `src/Back/Agent/Inbox.mjs` saves them outside public `web/`.

The public DI contracts for metadata consumers are `Fl32_Cms_Back_Publication_Source$` and `Fl32_Cms_Back_Publication_Catalog$`. Catalog entries contain source, metadata, Markdown, and derived HTML as separate fields. Tests must cover the real CMS plugin, web pipeline order, parser, discovery generation, and private inbox boundaries.
