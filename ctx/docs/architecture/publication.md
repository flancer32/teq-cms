# Markdown Publication

- Path: `ctx/docs/architecture/publication.md`
- Changed: `20260926`

## Ownership

TeqCMS owns opt-in publication routes, safe source reads, front-matter validation, deterministic catalog enumeration, HTTP representations, and discovery-file generation. `@teqfw/web` owns the pipeline and transport. `@flancer32/teq-tmpl` owns template lookup and the host-selected rendering engine. The host owns presentation templates, navigation, cards, and publication policy values.

## Source and Routes

A family has a safe relative `prefix` and a safe relative `.html` `presentation` template. A source at `tmpl/web/{locale}/{prefix}/{route}.md` maps to `/{locale}/{prefix}/{route}` for HTML and `/{locale}/{prefix}/{route}.md` for Markdown. Prefixes may contain several path segments and cannot overlap. No route taxonomy is imposed below the prefix. A source is eligible only if it belongs to a configured family.

Front matter is a YAML mapping with nonempty `title`, `description`, and an ISO calendar `date`; hosts may include other metadata. The source file and body Markdown remain authoritative. Parsed metadata and rendered HTML are derived values. Reads validate locale and route before filesystem access and require the resolved file to remain inside the configured source locale tree.

## Representations

The publication handler is registered by the CMS CLI plugin at PROCESS stage before the template and static handlers. A valid human route loads the exact locale source and renders the family presentation target through `Fl32_Tmpl_Back_Service_Render$`. Render data includes `publication` (source, metadata, Markdown, HTML, route, locale, family), `canonicalUrl`, `alternateUrls`, and `markdownAlternateUrl` only for a machine locale. The host decides how to emit link elements.

A direct Markdown URL is served as `text/markdown; charset=utf-8` only for an explicitly configured machine locale. Other localized Markdown URLs receive a 404 before template or static resolution. The finite `cms:generate` command writes `robots.txt`, `llms.txt`, and `sitemap.xml` into the host's `web/` directory. Discovery includes only configured publication families; `llms.txt` lists only configured machine locales, and the sitemap lists their human HTML routes. Regeneration is required after source changes.

Human locales come from `TEQFW_TMPL`, and machine locales from `TEQ_CMS__PUBLICATION_MACHINE_LOCALES`. Agents maintain files under each locale directly. Publication and source exposure require explicit host configuration.

## Agent Contact

When enabled, the `@teqfw/web` PROCESS handler accepts `GET /agent/message` with message data in headers, then writes a private JSON record for the site owner. It is disabled by default and can require a shared token. The CMS does not deliver the message to an external service.
