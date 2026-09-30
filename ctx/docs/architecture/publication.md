# Markdown Publication

- Path: `ctx/docs/architecture/publication.md`
- Changed: `20260930`

## Ownership

TeqCMS owns public-tree publication routes and legacy family reservations, safe source reads, front-matter validation, deterministic catalog enumeration, HTTP representations, and discovery-file generation. `@teqfw/web` owns the pipeline and transport. `@flancer32/teq-tmpl` owns template lookup, locale configuration, and the host-selected rendering engine. The host owns presentation templates, navigation, cards, and publication policy values.

## Site Publication and Host Policy

The default mode publishes all valid Markdown under `tmpl/web/`, including unlocalized sources and root-level pages. A host substitutes `Fl32_Cms_Back_Publication_Policy$` through DI to define `getMode()`, `getStaticPrefixes()`, and `getPresentationName({route, locale})`. The default policy selects site mode when the legacy family list is empty, excludes `/assets/` from templating, and uses `publication.html`. A nonempty legacy list selects families mode. Explicit site policy combined with a nonempty legacy list is rejected. These are host-code decisions, not new environment settings.

Sources without a locale use the empty-string locale identity. Neutral Markdown source selection prefers unlocalized, then maintained `en`, then tmpl default. HTML uses the human language selection below, including neutral `.html`. Localized Markdown and HTML retain exact-locale source selection. Unlocalized Markdown is not a content fallback for localized HTML.

`index.md` is the root resource: `/` negotiates representation; `/index.md` guarantees neutral Markdown; `/{locale}/` is its localized HTML canonical address for human requests. Unlocalized HTML has canonical `/`. `/index` and localized `/index` plus representation suffixes are aliases of that identity. Root locale entry addresses with or without a trailing slash resolve to `index`. Nested `section/index.md` retains the explicit `section/index` identity; no implicit directory index publication is introduced.

HTTP handles the route as a Markdown publication when a source for that logical route exists in any eligible source locale, including invalid sources. This source priority never forces a raw Markdown response: the selected representation determines raw source delivery or HTML rendering. A missing exact source, invalid selected source, or missing presentation returns 404. Only a wholly absent Markdown route continues to ordinary HTML and static delivery. A corrupt highest-priority neutral source is not silently replaced by another language. Ordinary templates are the second tier and `web/` static files are the third tier; `/` therefore uses unlocalized `index.md` ahead of `web/index.html`.

Static policy prefixes match whole URL segments and use only the standard web static handler. A missing file terminates with 404. `/robots.txt`, `/llms.txt`, and `/sitemap.xml` are always static-only; `/agent/message` remains reserved for the optional endpoint. Static exclusions are shared by Source, Catalog, HTTP, and discovery. They define delivery mode, not privacy. All files under `tmpl/web/` are public, but only strict route names and valid Markdown metadata form the publication corpus; `.prompt.md` sidecars, presentation HTML, and unrelated files are not Markdown publications.

## Source and Routes

In legacy families mode, a family has a safe relative `prefix` and a safe relative `.html` `presentation` template. Its explicit locale variants reside at `tmpl/web/{locale}/{prefix}/{route}.md`. Prefixes may contain several path segments and cannot overlap. Their first segment must not be a maintained tmpl locale: that URL segment is reserved for localized representations, preventing collisions with neutral resources. Invalid families are rejected during configuration projection. No route taxonomy is imposed below the prefix. In that mode a source is eligible only if it belongs to a configured family.

Front matter is a YAML mapping with nonempty `title`, `description`, and an ISO calendar `date`; hosts may include other metadata. The source file and body Markdown remain authoritative. Parsed metadata and rendered HTML are derived values. Source access validates locale and route and requires the resolved file to remain inside the configured source locale tree. Private files must reside outside the public template and web trees. Prompt sidecars with dotted route names are outside the Markdown publication corpus.

## Representations

The [product model](../product/overview.md) defines locale and representation semantics. Their URL contract is:

| URL | Representation | Source |
| --- | --- | --- |
| `/{route}` | Negotiated Markdown or HTML | Markdown: neutral preference; HTML: human language selection below |
| `/{route}.md` | Guaranteed raw Markdown | Same neutral source selection |
| `/{locale}/{route}.md` | Guaranteed raw Markdown | Exact requested locale variant |
| `/{locale}/{route}` | Negotiated Markdown or HTML | Exact requested locale variant |
| `/{locale}/{route}.html` | Guaranteed HTML | Exact requested locale variant |
| `/{route}.html` | Guaranteed HTML | Human language selection below |

Here `route` includes the configured prefix in families mode. Source selection and response format are independent. For example, a human request to `/docs/foo` uses its preferred supported language; an agent request reads the neutral Markdown source. `/en/docs/foo` selects English content for either representation. A found invalid neutral candidate returns 404 in site mode; legacy families retain their prior eligible `en` then default selection. Human locales come from tmpl; TeqCMS adds no agent locale configuration.

### Header Selection

Explicit lowercase `.md` and `.html` select the format ahead of `Accept` and `User-Agent`; they do not override `Accept-Language`. Without either suffix:

1. `Accept` explicitly preferring `text/markdown` selects Markdown. `text/html` or `application/xhtml+xml` selects HTML. Supported types are compared by their greatest declared `q` weight (default `1`); malformed weights are treated as `0`. A greater positive weight wins.
2. Equal, missing, wildcard-only, or otherwise ambiguous preferences use `User-Agent` hints. Case-insensitive `bot`, `crawler`, `spider`, `agent`, `chatgpt`, `claude`, `anthropic`, `curl/`, `wget/`, `python-requests`, `python-httpx`, `aiohttp`, `scrapy`, and `libwww` identify agent requests. Other clients default to HTML.
3. An explicitly rejected supported representation (`q=0`) is not selected; if both are explicitly rejected, the publication returns 406. This selection covers the supported publication formats, not general-purpose HTTP media negotiation.

Extensionless publication responses, including representation-unavailable 404 and negotiation 406, send `Vary: Accept, User-Agent`; neutral addresses also include `Accept-Language`. Neutral `.html` sends `Vary: Accept-Language`. Explicit localized suffix responses and neutral `.md` do not vary by these headers. Classification is a public delivery hint, not authentication or a privacy boundary. Static exclusions and ordinary non-publication delivery keep their own contracts.

Markdown responses use `text/markdown; charset=utf-8` and contain the selected authored source, including front matter. HTML responses use `text/html; charset=utf-8`. An unavailable representation receives a 404; it does not resolve as an ordinary template or static file. Localized `.md` exposes only the exact valid public source and requires no presentation template. Neutral `.html` uses the same human language selection as negotiated HTML.

### HTML Language Selection

Representation and language are separate decisions. `.html` forces HTML even for an agent, but does not force the default language. For HTML, resolve the human locale in this order:

1. An explicit maintained locale in the URL overrides `Accept-Language` and the default.
2. Otherwise use the highest positive `q` preference in `Accept-Language` matching a maintained locale. Matching is case-insensitive; an exact tag is tried before its primary language (`ru-RU` may select maintained `ru`). Missing `q` means `1`; zero, malformed, or out-of-range weights are excluded. Equal weights preserve header order.
3. If no preference matches (including absent or wildcard-only headers), use `TEQFW_TMPL__DEFAULT_LOCALE`.

For a neutral URL in site mode, an authored unlocalized source takes priority, including its invalid-source 404; it carries no configurable locale identity. Otherwise require the exact resolved maintained locale source. Do not try English or another localized source after a missing, invalid, or unmaintained human locale. Explicit localized URLs never substitute unlocalized content. A site with only unlocalized publications can render HTML without locale configuration.

These rules apply to `/`, neutral nested routes, and neutral `.html` aliases. Neutral Markdown does not inspect `Accept-Language`: its stable unlocalized → maintained `en` → default preference remains suitable for discovery links. For example, with `en` and `ru` sources and default `ru`, an English browser gets English HTML, a Russian browser gets Russian HTML, and a request without a supported language gets Russian HTML. An agent requesting neutral Markdown still gets English.

HTML availability requires a valid selected source (unlocalized for neutral HTML with an authored unlocalized source, otherwise the exact selected human locale) and a readable, nonempty presentation template resolved through tmpl, including its normal presentation-template fallback. HTTP, HTML alternate links, and the sitemap use this same availability rule. Missing or empty presentation templates exclude the HTML projection without excluding the neutral Markdown resource. Engine failures during request rendering are logged and return 404.

The family presentation template receives publication data (source, metadata, Markdown, derived HTML, route, source locale, and family), the HTML projection's `canonicalUrl`, available localized HTML `alternateUrls`, and `markdownAlternateUrl` pointing to the neutral resource when it is available. All HTML spellings use the resolved locale's extensionless HTML `canonicalUrl` and the same extensionless `alternateUrls`; neutral `.html` therefore has the selected source locale's HTML canonical. `markdownAlternateUrl` always uses explicit neutral `.md`, including `/index.md` for home, so a browser following it receives Markdown too. Unlocalized HTML uses the neutral extensionless canonical; neutral HTML selected from a locale uses that source locale's canonical. The HTML projection's canonical link is distinct from its guaranteed Markdown alternate. The host decides how to emit link elements and compose the page. Publication routing does not change existing non-publication HTML template behavior.

The HTTP handler removes exactly one terminal lowercase `.md` or `.html` suffix before validating the logical route. Source APIs continue to accept only extensionless logical routes. Other extensions, chained suffixes, encoded paths, traversal, repeated separators, and trailing separators remain unavailable; an alias cannot expose arbitrary files.

## Discovery

The finite `cms:generate` command writes `robots.txt`, `llms.txt`, and `sitemap.xml` into the host's `web/` directory. Discovery uses only public, valid publications from the policy-selected corpus; regeneration is required after source changes.

- `llms.txt` lists each available locale-neutral Markdown resource once with an explicit `.md` URL (home `/index.md`), using the same source selection contract as HTTP publication. It does not enumerate Markdown URLs per locale.
- `sitemap.xml` lists available extensionless HTML projections from unlocalized sources in site mode and from exact maintained locale sources, independently of neutral Markdown availability. It does not add neutral aliases of localized HTML, `.html` aliases, or localized Markdown URLs, avoiding duplicate entries. Sitemap URLs are HTML addresses for human requests and still negotiate for agent requests.
- `robots.txt` retains its crawl directives and sitemap reference; these static files do not negotiate representations.

## Agent Contact

When enabled, the `@teqfw/web` PROCESS handler accepts `GET /agent/message` with message data in headers, then writes a private JSON record for the site owner. It is disabled by default and can require a shared token. The CMS does not deliver the message to an external service.
