# Markdown Publication

- Path: `ctx/docs/architecture/publication.md`
- Changed: `20260923`

## Ownership

TeqCMS owns opt-in publication routes, safe source reads, front-matter validation, deterministic catalog enumeration, HTTP representations, discovery, and Markdown translation. `@teqfw/web` owns the pipeline and transport. `@flancer32/teq-tmpl` owns template lookup and the host-selected rendering engine. The host owns presentation templates, navigation, cards, sitemap integration, and publication policy values.

## Source and Routes

A family has a safe relative `prefix` and a safe relative `.html` `presentation` template. A source at `tmpl/web/{locale}/{prefix}/{route}.md` maps to `/{locale}/{prefix}/{route}` for HTML and `/{locale}/{prefix}/{route}.md` for Markdown. Prefixes may contain several path segments and cannot overlap. No route taxonomy is imposed below the prefix. A source is eligible only if it belongs to a configured family.

Front matter is a YAML mapping with nonempty `title`, `description`, and an ISO calendar `date`; hosts may include other metadata. The source file and body Markdown remain authoritative. Parsed metadata and rendered HTML are derived values. Reads validate locale and route before filesystem access and require the resolved file to remain inside the configured source locale tree.

## Representations

The publication handler is registered by the CMS CLI plugin at PROCESS stage before the template and static handlers. A valid human route loads the exact locale source and renders the family presentation target through `Fl32_Tmpl_Back_Service_Render$`. Render data includes `publication` (source, metadata, Markdown, HTML, route, locale, family), `canonicalUrl`, `alternateUrls`, and `markdownAlternateUrl` only for a machine locale. The host decides how to emit link elements.

A direct Markdown URL is served as `text/markdown; charset=utf-8` only for an explicitly configured machine locale. Other localized Markdown URLs receive a 404 before template or static resolution. The discovery path, by default `/llms.txt`, emits sorted absolute Markdown URLs from the catalog for machine locales only, plus concise human and machine locale declarations. It does not replace the host's HTML sitemap.

The translation base locale comes from `TEQ_CMS__LOCALE_BASE_TRANSLATE`, human locales from `TEQFW_TMPL`, and machine locales from `TEQ_CMS__PUBLICATION_MACHINE_LOCALES`. These are independent policy values. Translation never changes the machine-locale configuration.

## Translation

`cms:translate` continues to scan HTML files and additionally scans `.md` files only below configured family prefixes. The translation DB keeps relative filenames, including their extensions, so HTML and Markdown state remain separate. Markdown translation sends selected human-language metadata and body prose to the LLM while protecting structural tokens. The output is accepted only if the protected token sequence and translatable field set are preserved. Original front-matter keys, dates, route identity, non-language metadata, URLs, code, and raw HTML remain in the authored structure. Failed structural validation does not publish a translation.
