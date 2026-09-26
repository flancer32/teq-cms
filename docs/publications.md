# Markdown publications

Markdown publication is optional. Add one or more families to `TEQ_CMS__PUBLICATION_FAMILIES` to enable it. Each family has a route `prefix` and the name of a host-owned HTML `presentation` template.

```dotenv
TEQFW_TMPL__ALLOWED_LOCALES=en,de,ru
TEQFW_TMPL__DEFAULT_LOCALE=de
TEQ_CMS__BASE_URL=https://example.com
TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"journal","presentation":"publication.html"}]
TEQ_CMS__PUBLICATION_MACHINE_LOCALES=en
```

The family prefix may be any safe relative path, such as `journal` or `stories/longform`. Prefixes cannot overlap. `PUBLICATION_MACHINE_LOCALES` accepts a comma-separated list of maintained locales; leave it empty when no raw Markdown should be public. An absolute `BASE_URL` without a path is required when publication is enabled. Publication is disabled until a host configures a family.

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

For this example, `/en/journal/example` renders HTML from `tmpl/web/en/journal/example.md`. `/en/journal/example.md` returns the original file as `text/markdown; charset=utf-8` because `en` is a machine locale. `/de/journal/example.md` returns 404. An agent authors and reviews each locale's source file.

## Present HTML

Create `tmpl/web/{locale}/publication.html`, or provide a template in the default locale for fallback. The host selects the template engine through its normal `@flancer32/teq-tmpl` composition. TeqCMS passes:

| Value | Meaning |
| --- | --- |
| `publication.source` | Original front matter and Markdown file. |
| `publication.metadata` | Parsed YAML metadata. |
| `publication.markdown` | Authored body Markdown. |
| `publication.html` | Derived body HTML. |
| `publication.route`, `publication.locale`, `publication.family` | Publication identity. |
| `canonicalUrl` | Absolute URL of this locale's HTML page. |
| `alternateUrls` | Absolute HTML URLs keyed by human locale. |
| `markdownAlternateUrl` | Absolute Markdown URL only for a machine locale; otherwise absent. |

The template owns page layout, navigation, cards, SEO elements, and any CTA. With the Nunjucks engine, the body and optional Markdown alternate can be emitted as follows:

```html
<h1>{{ publication.metadata.title }}</h1>
<article>{{ publication.html | safe }}</article>
<link rel="canonical" href="{{ canonicalUrl }}">
{% if markdownAlternateUrl %}<link rel="alternate" type="text/markdown" href="{{ markdownAlternateUrl }}">{% endif %}
```

Use the equivalent syntax for another selected engine. The host can use `Fl32_Cms_Back_Publication_Catalog$` through DI to build indexes: `await catalog.list({locale: 'en'})` returns route-sorted entries with metadata, source, Markdown, and HTML. The catalog includes only configured families.

## Generate discovery files

Run `teq cms:generate` from the host application after editing the publication corpus. The command writes `web/robots.txt`, `web/llms.txt`, and `web/sitemap.xml`. Commit the generated files with the content they describe and regenerate them after content changes. The sitemap contains configured HTML publication routes; other site routes require host-owned sitemap integration.

`llms.txt` lists only the configured machine Markdown URLs in stable route order. The static web handler serves these files from `web/`. Empty machine locales produce no Markdown links.

## Agent contact

Set `TEQ_CMS__AGENT_MESSAGE_ENABLED=true` to enable `GET /agent/message`. Send an agent identifier in `X-Agent-Id` and a short message in `X-Agent-Message`; optionally configure `TEQ_CMS__AGENT_MESSAGE_TOKEN` and send it as `X-Agent-Token`. The handler returns `202 Accepted` after saving a JSON record under `var/teq-cms/agent-messages/`. The route is disabled by default. The host owner is responsible for reading this private inbox and arranging notification or reply outside the CMS.
