# Markdown Publication

- Path: `ctx/docs/architecture/publication.md`
- Changed: `20260930`

## Ownership

TeqCMS owns public-tree publication routes and legacy family reservations, safe source reads, front-matter validation, deterministic catalog enumeration, HTTP representations, and discovery-file generation. `@teqfw/web` owns the pipeline and transport. `@flancer32/teq-tmpl` owns template lookup, locale configuration, and the host-selected rendering engine. The host owns presentation templates, navigation, cards, and publication policy values.

## Site Publication and Host Policy

The default mode publishes all valid Markdown under `tmpl/web/`, including unlocalized sources and root-level pages. A host substitutes `Fl32_Cms_Back_Publication_Policy$` through DI to define `getMode()`, `getStaticPrefixes()`, and `getPresentationName({route, locale})`. The default policy selects site mode when the legacy family list is empty, excludes `/assets/` from templating, and uses `publication.html`. A nonempty legacy list selects families mode. Explicit site policy combined with a nonempty legacy list is rejected. These are host-code decisions, not new environment settings.

Sources without a locale use the empty-string locale identity. Neutral Markdown prefers unlocalized, then maintained `en`, then tmpl default. Localized Markdown and HTML retain exact-locale source selection; neutral `.html` uses the exact maintained default locale. Unlocalized Markdown is not a content fallback for localized HTML.

`index.md` is the root resource: `/` is its neutral canonical Markdown address; `/{locale}/` is its localized HTML canonical address. `/index` and localized `/index` plus representation suffixes are aliases of that identity. Root locale entry addresses with or without a trailing slash resolve to `index`. Nested `section/index.md` retains the explicit `section/index` identity; no implicit directory index publication is introduced.

HTTP uses Markdown when a source for that logical route exists in any eligible source locale, including invalid sources. A missing exact source, invalid selected source, or missing presentation returns 404. Only a wholly absent Markdown route continues to ordinary HTML and static delivery. A corrupt highest-priority neutral source is not silently replaced by another language. Ordinary templates are the second tier and `web/` static files are the third tier; `/` therefore uses unlocalized `index.md` ahead of `web/index.html`.

Static policy prefixes match whole URL segments and use only the standard web static handler. A missing file terminates with 404. `/robots.txt`, `/llms.txt`, and `/sitemap.xml` are always static-only; `/agent/message` remains reserved for the optional endpoint. Static exclusions are shared by Source, Catalog, HTTP, and discovery. They define delivery mode, not privacy. All files under `tmpl/web/` are public, but only strict route names and valid Markdown metadata form the publication corpus; `.prompt.md` sidecars, presentation HTML, and unrelated files are not Markdown publications.

## Source and Routes

In legacy families mode, a family has a safe relative `prefix` and a safe relative `.html` `presentation` template. Its explicit locale variants reside at `tmpl/web/{locale}/{prefix}/{route}.md`. Prefixes may contain several path segments and cannot overlap. Their first segment must not be a maintained tmpl locale: that URL segment is reserved for localized representations, preventing collisions with neutral resources. Invalid families are rejected during configuration projection. No route taxonomy is imposed below the prefix. In that mode a source is eligible only if it belongs to a configured family.

Front matter is a YAML mapping with nonempty `title`, `description`, and an ISO calendar `date`; hosts may include other metadata. The source file and body Markdown remain authoritative. Parsed metadata and rendered HTML are derived values. Source access validates locale and route and requires the resolved file to remain inside the configured source locale tree. Private files must reside outside the public template and web trees. Prompt sidecars with dotted route names are outside the Markdown publication corpus.

## Representations

The [product model](../product/overview.md) defines locale and representation semantics. Their URL contract is:

| URL | Representation | Source |
| --- | --- | --- |
| `/{prefix}/{route}` | Raw Markdown | Site: unlocalized, then maintained `en`, then default; families: `en`, then default |
| `/{prefix}/{route}.md` | Raw Markdown alias | Same neutral source selection |
| `/{locale}/{prefix}/{route}.md` | Raw Markdown | Exact requested locale variant |
| `/{locale}/{prefix}/{route}` | Server-rendered HTML | Exact requested locale variant |
| `/{locale}/{prefix}/{route}.html` | HTML alias | Exact requested locale variant |
| `/{prefix}/{route}.html` | HTML alias | Exact tmpl default locale variant |

For example, `/en/docs/foo` and `/ru/docs/foo` project their respective authored sources to HTML; `/docs/foo` identifies the canonical Markdown resource. In site mode neutral Markdown first checks the unlocalized source; missing candidates continue to maintained `en` and then tmpl default. A found invalid candidate returns 404. Legacy families retain their prior eligible `en` then default selection. Human locales also come from tmpl. TeqCMS adds no agent locale configuration.

Markdown responses use `text/markdown; charset=utf-8` and contain the selected authored source, including front matter. HTML responses use `text/html; charset=utf-8`. An unavailable representation receives a 404; it does not resolve as an ordinary template or static file. Localized `.md` exposes only the exact valid public source and requires no presentation template. Neutral `.html` renders the exact maintained tmpl default locale source, with no English or other content fallback; it returns 404 when the default locale is absent, unmaintained, or its source is unavailable.

HTML availability requires a valid exact-locale source and a readable, nonempty presentation template resolved through tmpl, including its normal presentation-template fallback. HTTP, HTML alternate links, and the sitemap use this same availability rule. Missing or empty presentation templates exclude the HTML projection without excluding the neutral Markdown resource. Engine failures during request rendering are logged and return 404.

The family presentation template receives publication data (source, metadata, Markdown, derived HTML, route, source locale, and family), the HTML projection's `canonicalUrl`, available localized HTML `alternateUrls`, and `markdownAlternateUrl` pointing to the neutral resource when it is available. All HTML spellings use the resolved locale's extensionless HTML `canonicalUrl` and the same extensionless `alternateUrls`; neutral `.html` therefore has the default locale's HTML canonical. `markdownAlternateUrl` remains the extensionless neutral Markdown URL, even when localized `.md` exists. The HTML projection's canonical link is distinct from the canonical agent-facing resource. The host decides how to emit link elements and compose the page. Publication routing does not change existing non-publication HTML template behavior.

The HTTP handler removes exactly one terminal lowercase `.md` or `.html` suffix before validating the logical route. Source APIs continue to accept only extensionless logical routes. Other extensions, chained suffixes, encoded paths, traversal, repeated separators, and trailing separators remain unavailable; an alias cannot expose arbitrary files.

## Discovery

The finite `cms:generate` command writes `robots.txt`, `llms.txt`, and `sitemap.xml` into the host's `web/` directory. Discovery uses only public, valid publications from the policy-selected corpus; regeneration is required after source changes.

- `llms.txt` lists each available locale-neutral Markdown resource once, using the same source selection contract as HTTP publication. It does not enumerate Markdown URLs per locale.
- `sitemap.xml` lists available extensionless localized HTML projections across maintained locales, independently of whether the neutral Markdown resource is available. Neither discovery file adds suffix aliases, neutral HTML aliases, or localized Markdown URLs, avoiding duplicate resource entries.
- `robots.txt` retains its crawl directives and sitemap reference; publication locale selection does not introduce crawler-specific routing.

## Agent Contact

When enabled, the `@teqfw/web` PROCESS handler accepts `GET /agent/message` with message data in headers, then writes a private JSON record for the site owner. It is disabled by default and can require a shared token. The CMS does not deliver the message to an external service.
