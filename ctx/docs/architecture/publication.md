# Markdown Publication

- Path: `ctx/docs/architecture/publication.md`
- Changed: `20260930`

## Ownership

TeqCMS owns opt-in publication routes, safe source reads, front-matter validation, deterministic catalog enumeration, HTTP representations, and discovery-file generation. `@teqfw/web` owns the pipeline and transport. `@flancer32/teq-tmpl` owns template lookup, locale configuration, and the host-selected rendering engine. The host owns presentation templates, navigation, cards, and publication policy values.

## Source and Routes

A family has a safe relative `prefix` and a safe relative `.html` `presentation` template. Its explicit locale variants reside at `tmpl/web/{locale}/{prefix}/{route}.md`. Prefixes may contain several path segments and cannot overlap. Their first segment must not be a maintained tmpl locale: that URL segment is reserved for localized projections, preventing collisions with neutral resources. Invalid families are rejected during configuration projection. No route taxonomy is imposed below the prefix. A source is eligible only if it belongs to a configured family.

Front matter is a YAML mapping with nonempty `title`, `description`, and an ISO calendar `date`; hosts may include other metadata. The source file and body Markdown remain authoritative. Parsed metadata and rendered HTML are derived values. Source access validates locale and route and requires the resolved file to remain inside the configured source locale tree. Private files and prompt sidecars are outside the publication corpus.

## Representations

The [product model](../product/overview.md) defines locale and representation semantics. Their URL contract is:

| URL | Representation | Source |
| --- | --- | --- |
| `/{locale}/{prefix}/{route}` | Server-rendered HTML | Exact requested locale variant |
| `/{prefix}/{route}` | Raw Markdown | Publication source selected by the product preference |

For example, `/en/docs/foo` and `/ru/docs/foo` project their respective authored sources to HTML; `/docs/foo` identifies the canonical Markdown resource. The neutral Markdown resource prefers the `en` source; if unavailable, it uses the site's default locale source configured by `@flancer32/teq-tmpl`; if that is also unavailable, the representation does not exist. Human locales also come from tmpl. TeqCMS adds no agent locale configuration.

Markdown responses use `text/markdown; charset=utf-8` and contain the selected authored source, including front matter. HTML responses use `text/html; charset=utf-8`. An unavailable representation receives a 404; it does not resolve as an ordinary template or static file. Localized URLs with a `.md` suffix are not publication representations and do not expose source files.

HTML availability requires a valid exact-locale source and a readable, nonempty presentation template resolved through tmpl, including its normal presentation-template fallback. HTTP, HTML alternate links, and the sitemap use this same availability rule. Missing or empty presentation templates exclude the HTML projection without excluding the neutral Markdown resource. Engine failures during request rendering are logged and return 404.

The family presentation template receives publication data (source, metadata, Markdown, derived HTML, route, source locale, and family), the HTML projection's `canonicalUrl`, available localized HTML `alternateUrls`, and `markdownAlternateUrl` pointing to the neutral resource when it is available. The HTML projection's canonical link is distinct from the canonical agent-facing resource. The host decides how to emit link elements and compose the page. Publication routing does not change existing non-publication HTML template behavior.

## Discovery

The finite `cms:generate` command writes `robots.txt`, `llms.txt`, and `sitemap.xml` into the host's `web/` directory. Discovery uses only public, valid publications in configured families; regeneration is required after source changes.

- `llms.txt` lists each available locale-neutral Markdown resource once, using the same source selection contract as HTTP publication. It does not enumerate Markdown URLs per locale.
- `sitemap.xml` lists available localized HTML projections across maintained locales, independently of whether the neutral Markdown resource is available.
- `robots.txt` retains its crawl directives and sitemap reference; publication locale selection does not introduce crawler-specific routing.

## Agent Contact

When enabled, the `@teqfw/web` PROCESS handler accepts `GET /agent/message` with message data in headers, then writes a private JSON record for the site owner. It is disabled by default and can require a shared token. The CMS does not deliver the message to an external service.
