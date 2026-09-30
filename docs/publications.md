# Markdown publications

Markdown is the primary authored content in TeqCMS. Agents maintain source files directly in Git; HTML pages are server-rendered projections. Everything inside `tmpl/web/` is public. Keep private instructions and other private material outside both `tmpl/web/` and `web/`.

## Publish the whole site

Without a nonempty legacy `PUBLICATION_FAMILIES` list, the default CMS policy publishes Markdown across `tmpl/web/`. No route-family registration or new environment switch is needed.

```dotenv
TEQFW_TMPL__ALLOWED_LOCALES=en,de,ru
TEQFW_TMPL__DEFAULT_LOCALE=de
TEQ_CMS__BASE_URL=https://example.com
```

The CLI host supplies the application root. Locales belong to `@flancer32/teq-tmpl`. `BASE_URL` is a deployment setting; the host's route and presentation policy lives in code. An absolute HTTP(S) `BASE_URL` without a path is required for publication HTML links and discovery.

```text
tmpl/web/about.md              # unlocalized neutral source
tmpl/web/en/about.md           # exact English source
tmpl/web/de/about.md           # exact German source
tmpl/web/en/docs/start.md      # nested English publication
tmpl/web/index.md              # neutral home source
tmpl/web/en/index.md           # English home source
tmpl/web/publication.html      # shared presentation template
web/assets/logo.svg           # static resource
```

A source contains YAML front matter with nonempty `title`, `description`, and an ISO calendar `date`. Additional fields remain available to the host presentation. Optional `indexable: false` excludes that source from generated discovery while keeping it public; use a YAML boolean, not a quoted string:

```markdown
---
title: About the project
description: A short introduction
date: 2026-09-30
summary: Optional card text
---
# About the project

Authored Markdown body.
```

Authored Markdown and embedded HTML are trusted public site content. TeqCMS does not translate content, call an LLM API, or manage translation state. Agents create locale variants as ordinary source files.

## URL matrix and source selection

| URL | Representation | Source selection |
| --- | --- | --- |
| `/about` | Negotiated HTML or Markdown | Markdown: unlocalized → maintained `en` → default; HTML: human language selection |
| `/about.md` | Guaranteed neutral Markdown | Unlocalized → maintained `en` → default |
| `/en/about.md` | Exact English Markdown | `tmpl/web/en/about.md` only |
| `/en/about` | Negotiated English HTML or Markdown | Same exact English source |
| `/en/about.html` | English HTML alias | Same exact English source |
| `/about.html` | HTML alias | Same human language selection |

Nested paths use the same rules. Markdown responses include the entire authored file, including front matter, with `text/markdown; charset=utf-8`. HTML uses `text/html; charset=utf-8`. Available aliases return 200 directly, without redirects. Explicit `.md` or `.html` selects the format ahead of `Accept` and `User-Agent`; it does not override `Accept-Language`. For extensionless publication URLs, `Accept` preference for `text/markdown` versus `text/html` or `application/xhtml+xml` selects the format by `q` weight (default `1`). Equal, missing, or wildcard-only preferences use `User-Agent`: recognized bots, agents, and command-line clients receive Markdown; browsers and unknown clients receive HTML. For example, `curl -H 'Accept: text/html' https://example.com/` renders HTML despite curl's agent hint. `curl -H 'Accept: text/markdown' https://example.com/` returns the authored home source.

A supported representation explicitly rejected with `q=0` is excluded; rejecting both returns 406. Extensionless publication responses send `Vary: Accept, User-Agent` (plus `Accept-Language` for neutral URLs); neutral `.html` sends `Vary: Accept-Language`, including representation-unavailable 404 and negotiation 406. Client classification is a delivery hint, not access control.

HTML selects its language by explicit URL locale, then supported `Accept-Language`, then `TEQFW_TMPL__DEFAULT_LOCALE`. This applies to both extensionless HTML and `.html` aliases: the suffix controls format only. Header preferences use positive `q` weights in descending order, stable ties, case-insensitive exact tags then primary languages (for example `ru-RU` → `ru`); malformed and zero weights are excluded. Unsupported or absent preferences use the default. In site mode an authored unlocalized source keeps priority for neutral HTML; otherwise the exact selected maintained locale source is required. Missing or invalid selected content returns 404 without substituting English or another locale. Explicit localized URLs never substitute unlocalized content. Neutral Markdown ignores `Accept-Language` and retains unlocalized → English → default selection. HTML also requires a readable, nonempty presentation; the presentation template may use tmpl's normal template fallback, which does not substitute Markdown content.

For a bilingual site with default `ru`, these requests demonstrate independent format and language selection:

```bash
curl -H 'Accept: text/html' -H 'Accept-Language: en-US,en;q=0.9' https://example.com/
curl -H 'Accept: text/html' -H 'Accept-Language: ru-RU,ru;q=0.9' https://example.com/
curl -H 'Accept: text/html' https://example.com/
curl -H 'Accept-Language: en' https://example.com/index.html
curl -H 'Accept: text/markdown' -H 'Accept-Language: ru' https://example.com/
```

Without an unlocalized home source, the first two return English and Russian HTML, the third returns default Russian HTML, the fourth returns English HTML regardless of curl's agent hint, and the last returns neutral English Markdown. Locale settings are loaded at process startup; restart the server after changing them or updating the package.

A found corrupt, unreadable, or unsafe highest-priority neutral source returns 404 instead of silently falling through to another language. A missing neutral candidate proceeds to the next candidate. Missing exact sources and unavailable HTML representations return 404 when the publication exists in another eligible source locale.

Only one terminal lowercase `.md` or `.html` representation suffix is supported. Logical route segments contain letters, digits, underscores, and hyphens. Traversal, encoded spellings, repeated separators, chained suffixes, and source symlinks are rejected. Dotted sidecars such as `about.prompt.md`, presentation templates, and unrelated files are not Markdown publications. Source APIs accept logical routes without representation suffixes.

## Main page and delivery priority

In site mode `/` addresses `index.md` and negotiates HTML or Markdown; `/index.md` guarantees neutral Markdown. Human requests to `/{locale}/` render localized HTML; agent requests read the exact localized source. Unlocalized HTML uses canonical `/`. `/index`, `/index.md`, `/index.html`, and localized `/index` forms are aliases. `/{locale}` and `/{locale}/` both address the localized home projection. `/index.html` uses the same human language selection as `/`. Nested `docs/index.md` has the explicit route `/docs/index`; no implicit nested directory index publication is introduced.

For ordinary requests the order is:

1. Existing Markdown publication, including its invalid-source or unavailable-representation 404.
2. Ordinary HTML/template delivery when the Markdown route is wholly absent.
3. Static files under `web/`.
4. 404.

Therefore `tmpl/web/index.md` handles `/` even if `web/index.html` exists: people receive its rendered HTML and agents receive raw Markdown. Markdown source priority does not force a Markdown HTTP response. With no Markdown home, an HTML template can handle the request; ordinary locale redirects remain applicable. If only `web/index.html` exists, `/` serves that file. Template lookup supports the requested locale, the default locale, and the unlocalized template directory.

## Host routing policy through DI

The replaceable `Fl32_Cms_Back_Publication_Policy$` contract has three synchronous methods:

| Method | Contract |
| --- | --- |
| `getMode()` | Return `site` or `families`. |
| `getStaticPrefixes()` | Return absolute path prefixes ending in `/`, such as `/assets/`. |
| `getPresentationName({route, locale})` | Return a safe relative `.html` template name; empty-string `locale` denotes an unlocalized source. |

The default policy selects site mode when the legacy family list is empty, returns `['/assets/']`, and selects `publication.html`. The host can supply its own module, for example `Host_Back_Publication_Policy`:

```js
export default class Policy {
    getMode = () => 'site';
    getStaticPrefixes = () => ['/assets/', '/downloads/'];
    getPresentationName = ({route, locale}) => {
        void locale;
        return route.startsWith('docs/') ? 'documentation.html' : 'publication.html';
    };
}
```

Map the contract using a host DI preprocessor registered by the host's CLI configurator. Declare the host namespace in its package metadata. No host-local HTTP handler is needed:

```js
export default function Preprocessor() {
    return depId => depId.address === 'Fl32_Cms_Back_Publication_Policy'
        ? Object.freeze({...depId, address: 'Host_Back_Publication_Policy'})
        : depId;
}
```

The host configurator returns its composition policy, preserving any other required preprocessors:

```js
return {container: {preprocessors: [
    'Fl32_Cms_Back_Di_Preprocessor$',
    'Host_Back_Di_Preprocessor$',
]}};
```

The CMS default policy is directly resolvable without the standalone CMS preprocessor. Replacing it uses normal host DI substitution; do not edit installed dependencies or create another Container.

Static prefix matching respects path segments: `/assets/` matches `/assets` and `/assets/...`, not `/assets-other/...`. Those requests go directly to the standard web static handler under `web/assets/`, skipping Markdown and template lookup. Missing files terminate with 404. Unsafe or encoded paths are rejected. These exclusions affect HTTP, publication catalogs, and generated discovery consistently. They select delivery mode, not privacy.

`/robots.txt`, `/llms.txt`, and `/sitemap.xml` are always static-only. `/agent/message` remains reserved for the optional agent endpoint even if a static prefix covers `/agent/`.

## Present HTML and build indexes

Provide the policy-selected presentation in `tmpl/web/{locale}/`, the default locale for fallback, or the unlocalized template directory. The host owns the template and engine choice. TeqCMS supplies:

| Value | Meaning |
| --- | --- |
| `publication.source` | Entire authored source file. |
| `publication.metadata` | Parsed front matter. |
| `publication.markdown` | Body Markdown. |
| `publication.html` | Derived body HTML. |
| `publication.route`, `publication.locale`, `publication.family` | Logical identity and resolved presentation descriptor. |
| `canonicalUrl` | Extensionless HTML URL for the source locale; unlocalized home uses `/`, localized home uses `/{locale}/`. |
| `alternateUrls` | Canonical HTML URLs for locales with valid sources and available presentations. |
| `markdownAlternateUrl` | Guaranteed neutral Markdown URL ending in `.md` when available; home uses `/index.md`. |

All HTML aliases share these canonical and alternate links. Engine failures are logged and return 404. For example, a Mustache presentation can emit:

```html
<h1>{{ publication.metadata.title }}</h1>
<article>{{{publication.html}}}</article>
<link rel="canonical" href="{{{canonicalUrl}}}">
{{#markdownAlternateUrl}}<link rel="alternate" type="text/markdown" href="{{{markdownAlternateUrl}}}">{{/markdownAlternateUrl}}
```

`Fl32_Cms_Back_Publication_Catalog$` provides route-sorted `list({locale})` entries; in site mode `locale: ''` enumerates unlocalized sources without traversing maintained locale directories as neutral routes. `listHtml({locale})` applies presentation availability. `listNeutral()` deduplicates source routes and uses the same neutral selection as HTTP. `listRepresentations()` returns URL-sorted `{item, representation, url}` entries for distinct indexable source/format variants, with relative preferred URLs. Strict `Fl32_Cms_Back_Publication_Source$.read({locale, route})` diagnoses malformed sources; `readAvailable()` returns null for unavailable variants.

## Legacy family compatibility

A nonempty `TEQ_CMS__PUBLICATION_FAMILIES` list retains the previous selected-section mode:

```dotenv
TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"journal","presentation":"publication.html"}]
```

Families retain safe, unique, non-overlapping prefixes that cannot start with maintained locale codes. Their reserved routes do not fall through to ordinary delivery. Neutral Markdown retains `en → default` source selection, and family presentations come from the legacy descriptors. Root-level unlocalized publication is unavailable in this mode.

An explicit host site policy combined with a nonempty legacy family list is rejected. To migrate, remove the legacy family setting, move root-level sources to their intended paths, provide a host policy and presentations where required, update links, and regenerate discovery. Hosts should define new route policy in code instead of adding environment settings. An explicitly substituted policy returning `families` with an empty list disables Markdown publication while retaining ordinary template and static handling.

## Discovery and agent contact

Run `teq cms:generate` after content or host policy changes. It writes `web/robots.txt`, `web/llms.txt`, and `web/sitemap.xml`. The application root comes from the CLI host, not the working directory. Commit generated files with their content sources.

Choose sitemap representations in the CMS namespace:

```dotenv
TEQ_CMS__SITEMAP_REPRESENTATIONS=both
```

| Value | Sitemap scope |
| --- | --- |
| `html` | Default: available canonical HTML projections only. |
| `markdown` | Every distinct eligible Markdown source variant, independently of HTML presentation. |
| `both` | Both inventories, without equivalent aliases. |

Invalid values fail startup/generation. Omitting the setting preserves the previous HTML-only output. This is a discovery preference; it does not change HTTP negotiation or guarantee separate search-engine indexing for both formats. [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) recommends preferred canonical URLs; the [sitemap protocol](https://www.sitemaps.org/protocol.html) requires absolute, escaped URLs.

For bilingual `/about`, with English selected by neutral Markdown, mixed mode lists:

```text
/en/about       # English canonical HTML
/ru/about       # Russian canonical HTML
/about.md       # neutral Markdown selecting English
/ru/about.md    # exact Russian Markdown
```

`/en/about.md` and extensionless Markdown spellings are aliases of the selected English source and are omitted; `.html` aliases are omitted too. We retain explicit `.md` discovery URLs so following a Markdown entry with browser headers still returns Markdown. HTML canonicals stay extensionless and still negotiate for agent headers.

The same rules apply in site and family modes. Each valid exact source is considered even if the neutral route cannot select it. Neutral selection still prefers unlocalized → maintained `en` → tmpl default (families: `en` → default), independently of configured locale order and language headers. If no neutral source is available, eligible exact sources use `/{locale}/{route}.md`; missing/invalid translations never create fallback URLs. Authored unlocalized and localized sources are distinct variants, even with identical text.

Home HTML uses `/` for unlocalized content and `/{locale}/` for exact localized content. Neutral home Markdown uses `/index.md`; other localized home sources use `/{locale}/index.md`. The selected localized neutral source's exact `.md` alias is omitted. `/index`, `.html`, and locale-root aliases do not add entries. Nested `section/index` stays explicit.

HTML requires a valid source and readable, nonempty presentation through normal tmpl fallback. Missing HTML presentation removes only HTML; Markdown remains eligible. Engine errors during HTTP rendering remain request errors; generation checks structural presentation availability and does not execute every page template.

`llms.txt` remains the compact agent-facing list of selected neutral Markdown resources, with explicit `.md` URLs (home `/index.md`). It is unchanged by sitemap format selection and does not enumerate every translation. These neutral URLs are the same ones used by HTML `markdownAlternateUrl` and by a Markdown-inclusive sitemap. HTML language alternates remain exact canonical HTML links.

Set `indexable: false` in a source's front matter to exclude its representations from sitemap and, if selected by the neutral route, llms.txt. Absent/true keeps it discoverable. This does not make it private, block requests, change neutral selection, or suppress HTTP alternate links. Other indexable language sources still get their exact Markdown addresses; no substitute language is advertised at the excluded source's neutral URL.

Generation uses the validated `BASE_URL` origin and writes unique, sorted absolute URLs with XML escaping. The inventory includes Markdown publications and their HTML projections only. Static exclusions, private files outside public trees, reserved endpoints, invalid sources and dotted sidecars are excluded. Ordinary standalone HTML pages, presentation templates, layouts, includes, assets and error templates such as `404.html` are not enumerated. Hosts needing standalone HTML discovery must supply explicit page eligibility in their separate integration; scanning the template tree is insufficient.

Set `TEQ_CMS__AGENT_MESSAGE_ENABLED=true` to enable `GET /agent/message`. Send `X-Agent-Id` and `X-Agent-Message`; optionally configure `TEQ_CMS__AGENT_MESSAGE_TOKEN` and send `X-Agent-Token`. Accepted messages are stored privately under `var/teq-cms/agent-messages/`. The host owner handles notification and reply outside the CMS.
