# Publication Code Map

- Path: `ctx/docs/code/publication.md`
- Changed: `20260923`

- `src/Back/Config.mjs` projects family, machine locale, and discovery settings from `TEQ_CMS`.
- `src/Back/Publication/Source.mjs` validates locale, route, path containment, YAML front matter, and Markdown rendering.
- `src/Back/Publication/Catalog.mjs` enumerates configured source families in stable route order for host indexes, sitemap integration, and discovery.
- `src/Back/Publication/Handler.mjs` produces HTML, Markdown, and discovery through the web handler contract.
- `src/Back/Publication/Translate.mjs` prepares protected Markdown translation payloads and validates the result.
- `src/Back/Cli/Plugin.mjs` registers the publication handler when families are configured.
- `src/Back/Helper/Translate.mjs` limits `.md` translation scanning to configured families; `src/Back/Cli/Command/Translate.mjs` runs the translation workflow.

The public DI contracts for metadata consumers are `Fl32_Cms_Back_Publication_Source$` and `Fl32_Cms_Back_Publication_Catalog$`. Catalog entries contain source, metadata, Markdown, and derived HTML as separate fields. Tests must cover the real CMS plugin and web pipeline order as well as parser and translation boundaries.
