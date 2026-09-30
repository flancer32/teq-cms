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

A source contains YAML front matter with nonempty `title`, `description`, and an ISO calendar `date`. Additional fields remain available to the host presentation:

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
| `/about` | Canonical neutral Markdown | Unlocalized, then maintained `en`, then tmpl default |
| `/about.md` | Neutral Markdown alias | Same selection |
| `/en/about.md` | Exact English Markdown | `tmpl/web/en/about.md` only |
| `/en/about` | Canonical English HTML | Same exact English source |
| `/en/about.html` | English HTML alias | Same exact English source |
| `/about.html` | Default-locale HTML alias | Exact maintained tmpl default source only |

Nested paths use the same rules. Markdown responses include the entire authored file, including front matter, with `text/markdown; charset=utf-8`. HTML uses `text/html; charset=utf-8`. Available aliases return 200 directly, without redirects. Routing is independent of User-Agent and client identity.

Unlocalized content does not substitute for a missing requested locale. Neutral `.html` returns 404 if the default locale is absent, unmaintained, or has no valid source. HTML also requires a readable, nonempty presentation; the presentation template may use tmpl's normal template fallback, which does not substitute Markdown content.

A found corrupt, unreadable, or unsafe highest-priority neutral source returns 404 instead of silently falling through to another language. A missing neutral candidate proceeds to the next candidate. Missing exact sources and unavailable HTML representations return 404 when the publication exists in another eligible source locale.

Only one terminal lowercase `.md` or `.html` representation suffix is supported. Logical route segments contain letters, digits, underscores, and hyphens. Traversal, encoded spellings, repeated separators, chained suffixes, and source symlinks are rejected. Dotted sidecars such as `about.prompt.md`, presentation templates, and unrelated files are not Markdown publications. Source APIs accept logical routes without representation suffixes.

## Main page and delivery priority

In site mode `index.md` has canonical route `/` for neutral Markdown and `/{locale}/` for localized HTML. `/index`, `/index.md`, `/index.html`, and localized `/index` forms are aliases. `/{locale}` and `/{locale}/` both address the localized home projection. `/index.html` retains the neutral HTML default-locale policy. Nested `docs/index.md` has the explicit route `/docs/index`; no implicit nested directory index publication is introduced.

For ordinary requests the order is:

1. Existing Markdown publication, including its invalid-source or unavailable-representation 404.
2. Ordinary HTML/template delivery when the Markdown route is wholly absent.
3. Static files under `web/`.
4. 404.

Therefore `tmpl/web/index.md` handles `/` even if `web/index.html` exists. With no Markdown home, an HTML template can handle the request; ordinary locale redirects remain applicable. If only `web/index.html` exists, `/` serves that file. Template lookup supports the requested locale, the default locale, and the unlocalized template directory.

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
| `canonicalUrl` | Extensionless HTML URL for the resolved locale; home uses `/{locale}/`. |
| `alternateUrls` | Canonical HTML URLs for locales with valid sources and available presentations. |
| `markdownAlternateUrl` | Canonical neutral Markdown URL when available; home uses `/`. |

All HTML aliases share these canonical and alternate links. Engine failures are logged and return 404. For example, a Mustache presentation can emit:

```html
<h1>{{ publication.metadata.title }}</h1>
<article>{{{publication.html}}}</article>
<link rel="canonical" href="{{{canonicalUrl}}}">
{{#markdownAlternateUrl}}<link rel="alternate" type="text/markdown" href="{{{markdownAlternateUrl}}}">{{/markdownAlternateUrl}}
```

`Fl32_Cms_Back_Publication_Catalog$` provides route-sorted `list({locale})` entries; in site mode `locale: ''` enumerates unlocalized sources without traversing maintained locale directories as neutral routes. `listHtml({locale})` applies presentation availability. `listNeutral()` deduplicates source routes and uses the same neutral selection as HTTP. Strict `Fl32_Cms_Back_Publication_Source$.read({locale, route})` diagnoses malformed sources; `readAvailable()` returns null for unavailable variants.

## Legacy family compatibility

A nonempty `TEQ_CMS__PUBLICATION_FAMILIES` list retains the previous selected-section mode:

```dotenv
TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"journal","presentation":"publication.html"}]
```

Families retain safe, unique, non-overlapping prefixes that cannot start with maintained locale codes. Their reserved routes do not fall through to ordinary delivery. Neutral Markdown retains `en → default` source selection, and family presentations come from the legacy descriptors. Root-level unlocalized publication is unavailable in this mode.

An explicit host site policy combined with a nonempty legacy family list is rejected. To migrate, remove the legacy family setting, move root-level sources to their intended paths, provide a host policy and presentations where required, update links, and regenerate discovery. Hosts should define new route policy in code instead of adding environment settings. An explicitly substituted policy returning `families` with an empty list disables Markdown publication while retaining ordinary template and static handling.

## Discovery and agent contact

Run `teq cms:generate` after content or host policy changes. It writes `web/robots.txt`, `web/llms.txt`, and `web/sitemap.xml`. The application root comes from the CLI host, not the working directory. Commit generated files with their content sources.

`llms.txt` lists each available canonical neutral Markdown URL once. The sitemap lists canonical localized HTML across maintained locales with valid sources and available presentations. Static exclusions, suffix aliases, neutral HTML aliases, and per-locale Markdown aliases are omitted. Other ordinary site routes require host-owned sitemap integration.

Set `TEQ_CMS__AGENT_MESSAGE_ENABLED=true` to enable `GET /agent/message`. Send `X-Agent-Id` and `X-Agent-Message`; optionally configure `TEQ_CMS__AGENT_MESSAGE_TOKEN` and send `X-Agent-Token`. Accepted messages are stored privately under `var/teq-cms/agent-messages/`. The host owner handles notification and reply outside the CMS.
