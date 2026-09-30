# Markdown publications

Markdown is the primary authored content in TeqCMS. Agents work directly with version-controlled source files; human-facing HTML pages are derived projections. Publication routes are opt-in: add one or more families to `TEQ_CMS__PUBLICATION_FAMILIES` to enable them. Each family has a route `prefix` and the name of a host-owned HTML `presentation` template.

```dotenv
TEQFW_TMPL__ALLOWED_LOCALES=en,de,ru
TEQFW_TMPL__DEFAULT_LOCALE=de
TEQ_CMS__BASE_URL=https://example.com
TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"journal","presentation":"publication.html"}]
```

The family prefix may be any safe relative path, such as `journal` or `stories/longform`. Prefixes cannot overlap or begin with a maintained locale code (for example, `ru/docs` is rejected when `ru` is maintained). The first URL segment is reserved for explicitly localized representations. Locales and the optional default locale come from `@flancer32/teq-tmpl`; TeqCMS has no separate agent-locale setting. An absolute `BASE_URL` without a path is required when publication is enabled. Publication is disabled until a host configures a family.

## Author a publication

Put the localized source at `tmpl/web/{locale}/{prefix}/{route}.md`:

```markdown
---
title: A long story
description: A short description for the page
date: 2026-09-23
summary: Optional card text
image: /images/story.jpg
imageAlt: A view of the landscape
relationId: story-42
---
# A long story

Markdown body text with [a link](https://example.com).
```

`title`, `description`, and an ISO calendar `date` are required. Other YAML fields remain available to the presentation template. TeqCMS reads only source files under configured family prefixes. Keep authored Markdown and any raw HTML in Git and review it as trusted site content.

For this family, `/journal/example` is the canonical agent-facing raw Markdown resource. It selects the maintained `en` source first, then the site's tmpl default locale (`de` here), and returns 404 if neither source exists. English wins even when the site's human default is another language. `/en/journal/example` renders HTML from the exact `tmpl/web/en/journal/example.md` source; `/ru/journal/example` requires the Russian source. Another language never substitutes for missing localized content. An unavailable representation returns 404 before ordinary templates or static files can handle it.

## Publication URL matrix

For a family with prefix `docs`, all six forms address the logical route `docs/foo`:

| URL | Representation | Source selection |
| --- | --- | --- |
| `/docs/foo` | Canonical neutral Markdown | Maintained `en`, then tmpl default |
| `/docs/foo.md` | Neutral Markdown alias | Same as `/docs/foo` |
| `/en/docs/foo.md` | Exact-locale Markdown | English source only |
| `/en/docs/foo` | Canonical English HTML | English source only |
| `/en/docs/foo.html` | English HTML alias | English source only |
| `/docs/foo.html` | Default-locale HTML alias | Tmpl default source only (`de` in this example) |

Neutral `.html` does not use the neutral Markdown language preference. It returns 404 if the default locale is unset, is not maintained, or has no valid source. Localized `.md` and HTML return 404 for absent, unreadable, or invalid exact-locale sources, without content-language fallback. Markdown requires no presentation template; every HTML form requires a readable, nonempty presentation. Aliases return their requested representation directly with 200 when available; they do not redirect.

Only one terminal lowercase `.md` or `.html` suffix is supported. Logical routes still contain only letters, digits, underscores, hyphens, and path separators. Other extensions, chained suffixes (such as `.md.html`), encoded spellings, traversal, repeated separators, and trailing slashes return 404 under reserved prefixes. The suffix selects a representation, never an arbitrary source file.

Markdown uses `text/markdown; charset=utf-8` and contains the complete authored file, including front matter. HTML uses `text/html; charset=utf-8`. Localized `.md` responses contain the exact authored source, including front matter. The URL determines representation independently of User-Agent or client identity. Existing non-publication HTML templates retain their behavior.

Agents read, create, maintain, translate, and review locale-specific Markdown files directly. To add a translation, create an ordinary Markdown file at the same `{prefix}/{route}.md` path under the target locale and commit it to Git. Maintain each variant as an explicit source file. TeqCMS does not translate content, call an LLM API, run automatic translation jobs, or store translation state.

## Present HTML

Create `tmpl/web/{locale}/publication.html`, or provide a template in the default locale for fallback. HTML availability requires both the exact-locale Markdown source and a readable, nonempty presentation template found by tmpl. HTTP, HTML alternates, and the sitemap use this same check; missing, unreadable, or empty presentations exclude HTML without excluding neutral Markdown. Request-time engine failures are logged and return 404. The host selects the template engine through its normal `@flancer32/teq-tmpl` composition. TeqCMS passes:

| Value | Meaning |
| --- | --- |
| `publication.source` | Original front matter and Markdown file. |
| `publication.metadata` | Parsed YAML metadata. |
| `publication.markdown` | Authored body Markdown. |
| `publication.html` | Derived body HTML. |
| `publication.route`, `publication.locale`, `publication.family` | Publication identity. |
| `canonicalUrl` | Absolute URL of this locale's HTML page. |
| `alternateUrls` | Absolute HTML URLs keyed only by locales with valid sources and available presentation templates. |
| `markdownAlternateUrl` | Absolute locale-neutral Markdown URL when an eligible source exists; otherwise absent. |

Every HTML alias uses the resolved locale's extensionless `canonicalUrl` and extensionless `alternateUrls`. For example, `/docs/foo.html` with default `de` has canonical `/de/docs/foo`; `/en/docs/foo.html` has canonical `/en/docs/foo`. `markdownAlternateUrl` always points to `/docs/foo` when available; localized Markdown URLs do not change this field. The HTML `canonicalUrl` identifies this locale's HTML projection; it is distinct from the neutral Markdown resource. The template owns page layout, navigation, cards, SEO elements, and any CTA. With the Nunjucks engine, the body and optional Markdown alternate can be emitted as follows:

```html
<h1>{{ publication.metadata.title }}</h1>
<article>{{ publication.html | safe }}</article>
<link rel="canonical" href="{{ canonicalUrl }}">
{% if markdownAlternateUrl %}<link rel="alternate" type="text/markdown" href="{{ markdownAlternateUrl }}">{% endif %}
```

Use the equivalent syntax for another selected engine. The host can use `Fl32_Cms_Back_Publication_Catalog$` through DI to build indexes: `await catalog.list({locale: 'en'})` returns route-sorted entries with metadata, source, Markdown, and HTML. The catalog includes only valid, readable sources in configured families; invalid variants are unavailable to HTTP and omitted from discovery. Source and catalog APIs take extensionless logical routes, not HTTP aliases. The strict `source.read({locale, route})` API rejects unsafe or malformed sources for callers that need diagnostics. `await catalog.listHtml({locale})` filters those entries by presentation availability. `await catalog.listNeutral()` returns each available neutral resource once using the same selection as HTTP; `await source.readNeutral({route})` on `Fl32_Cms_Back_Publication_Source$` selects its source.

## Generate discovery files

Run `teq cms:generate` from the host application after editing the publication corpus. The command writes `web/robots.txt`, `web/llms.txt`, and `web/sitemap.xml`. Commit the generated files with the content they describe and regenerate them after content changes. The sitemap contains available localized HTML publication routes across maintained locales, including publications without a neutral source; other site routes require host-owned sitemap integration.

`llms.txt` lists each available neutral Markdown resource once in stable route order, using the same `en → tmpl default locale → unavailable` selection as HTTP. It does not enumerate per-locale Markdown links. Both discovery files use only extensionless canonical addresses: suffix aliases and neutral HTML aliases are omitted to avoid duplicates. `robots.txt` retains crawl directives and its sitemap reference. The static web handler serves these files from `web/`.

## Agent contact

Set `TEQ_CMS__AGENT_MESSAGE_ENABLED=true` to enable `GET /agent/message`. Send an agent identifier in `X-Agent-Id` and a short message in `X-Agent-Message`; optionally configure `TEQ_CMS__AGENT_MESSAGE_TOKEN` and send it as `X-Agent-Token`. The handler returns `202 Accepted` after saving a JSON record under `var/teq-cms/agent-messages/`. The route is disabled by default. The host owner is responsible for reading this private inbox and arranging notification or reply outside the CMS.
