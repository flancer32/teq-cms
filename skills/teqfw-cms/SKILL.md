---
name: teqfw-cms
description: Use when integrating, configuring, testing, reviewing, or modifying the @flancer32/teq-cms TeqFW application and its host composition.
license: Apache-2.0
metadata:
  package: "@flancer32/teq-cms"
---

# @flancer32/teq-cms

Use this skill for consumer or maintenance work that crosses the TeqCMS
runtime, its TeqFW host composition, CMS configuration, localized templates,
web pipeline, or discovery command. The host project's instructions and
current source remain authoritative; this skill describes the package-owned
boundary and the checks that protect it.

## Content model

Treat version-controlled Markdown as the primary authored content. Agents read,
create, maintain, and translate those source files directly. Each locale variant
is an explicit Markdown file maintained in Git; human-facing HTML is a derived
projection. TeqCMS does not call an LLM API, run automatic translation jobs, or
store translation state.

## Apply

1. Read the host project's `AGENTS.md`, project context, package metadata, and
   the installed versions of the platform packages before changing behavior.
2. Treat `@teqfw/cli` as the Node.js process host. It creates the DI
   container, loads configuration once, initializes `TeqFw_Cli_Config$`,
   resolves lifecycle components, and owns command selection and process
   status.
3. Keep TeqCMS implementation modules under the `Fl32_Cms_` DI namespace,
   mapped to `./src` with `.mjs` files. Resolve platform and application
   services through DI identifiers; do not create another container or use
   physical imports as a replacement for DI.
4. Keep pre-DI composition in the host configurator at
   `bootstrap/di-config.mjs`. It is loaded dynamically before the container
   exists, implements the CLI configurator contract, and may select host
   implementations. It must remain plain host code and is intentionally
   outside `teqfw-esm-validator` validation.
5. Keep the CMS lifecycle plugin focused on registering the CMS handlers in
   the `@teqfw/web` pipeline. The `web:start` command belongs to
   `@teqfw/web`; the finite `cms:generate` command belongs to TeqCMS
   and is declared in `package.json` metadata.

## Configuration ownership

The CLI host supplies the standard configuration sources and loads them once
before plugins and commands are resolved. TeqFW cfg owns the raw immutable
snapshot; each package owns its typed projection through
`TeqFw_Cfg_Reader$`.

TeqCMS owns only the `TEQ_CMS` namespace:

- `TEQ_CMS__BASE_URL` — canonical public base URL;
- `TEQ_CMS__SITEMAP_REPRESENTATIONS` — `html` (default), `markdown`, or `both`; invalid values fail configuration;
- `TEQ_CMS__PUBLICATION_FAMILIES` — legacy selected-section compatibility; new host route policy belongs in code;
- `TEQ_CMS__AGENT_MESSAGE_ENABLED` — enables the private file inbox route;
- `TEQ_CMS__AGENT_MESSAGE_TOKEN` — optional shared contact token.

Template locale settings belong to `@flancer32/teq-tmpl` under `TEQFW_TMPL`.
The standalone CMS host also reads `TEQFW_TMPL__ENGINE` as a composition
choice; this key is not projected by the tmpl package.
Web-server settings belong to `@teqfw/web` under `TEQFW_WEB`.
Do not add CMS aliases for those settings, read `process.env` in runtime
components, or reintroduce the removed `TEQ_CMS_*` single-underscore names.
The application root is a CLI runtime fact from `TeqFw_Cli_Config$`, not a CMS
or template configuration setting.

## Publication contract

Everything under `tmpl/web/` is public. Site mode is the default when the legacy
family list is empty; it needs no family registration or environment mode key.
Keep private files outside the public template and static trees. The host defines
route policy in code by substituting `Fl32_Cms_Back_Publication_Policy$`:

- `getMode()` returns `site` or `families`;
- `getStaticPrefixes()` returns safe absolute prefixes ending in `/`;
- `getPresentationName({route, locale})` selects a safe relative `.html` presentation.

The default policy uses `/assets/` for static-only delivery and
`publication.html` for presentation. `Fl32_Cms_Back_Publication_Routing$`
validates and shares policy interpretation across Source, Catalog, HTTP, and
discovery. Static prefixes match whole segments and bypass template lookup;
missing files return 404. Discovery files are always static-only and the
optional agent endpoint retains its reserved URL.

Sources reside at `tmpl/web/{route}.md` or `tmpl/web/{locale}/{route}.md`.
An unlocalized source has `locale: ''`. Neutral Markdown prefers unlocalized,
then maintained `en`, then tmpl default. A found invalid higher-priority source
returns 404 instead of silently selecting another language. Localized Markdown
and HTML require exact locale sources. HTML language uses URL locale, then supported `Accept-Language`, then tmpl default,
including neutral `.html`. Neutral HTML in site mode prefers authored unlocalized
content; otherwise it requires the exact selected locale source. Presentation-template fallback never changes content language.

```text
/about          → negotiated HTML (human language) or neutral Markdown
/about.md       → guaranteed neutral Markdown
/en/about.md    → exact English Markdown
/en/about       → negotiated English HTML or Markdown
/en/about.html  → English HTML alias
/about.html     → HTML using the preferred human language
/               → negotiated neutral home HTML or Markdown
/index.md       → guaranteed neutral home Markdown
/en/            → negotiated exact English home HTML or Markdown
```

`/index` forms are aliases of the root identity; nested `docs/index` remains
explicit. Only supported terminal lowercase representation suffixes are removed
at the HTTP boundary. Source APIs accept strict logical routes. Keep traversal,
source symlink, locale, and metadata validation intact.

Explicit `.md` or `.html` selects the format ahead of `Accept` and `User-Agent`; it does not override `Accept-Language`. Extensionless publication URLs use
explicit `Accept` preference, then `User-Agent` hints: Markdown for agents, HTML
for people, with HTML as the ambiguous-client default. Send `Vary: Accept, User-Agent`
for negotiated responses, adding `Accept-Language` for neutral addresses. Neutral
`.html` varies by `Accept-Language`. Neutral Markdown ignores language headers;
HTML never substitutes another localized source for a missing selected language.

HTTP source order is Markdown, ordinary templates, then `web/` static delivery, then
404. A wholly absent Markdown route continues to lower tiers; an authored but
invalid or unavailable publication does not. Unlocalized `index.md` therefore
wins over `web/index.html` for `/`. Ordinary template locale redirects remain
applicable when no Markdown home exists.

Canonical HTML links and locale alternates remain extensionless; home HTML uses
`/{locale}/` or `/` for an unlocalized source. `markdownAlternateUrl` and
`llms.txt` use explicit neutral `.md` addresses, including `/index.md` for home.
The sitemap defaults to canonical unlocalized and localized HTML; hosts may select
Markdown-only or both. `Catalog.listRepresentations()` provides a shared inventory:
Markdown does not require HTML presentation; each exact maintained source remains
eligible independently of neutral selection. The neutral selected source uses its
existing explicit `.md` address; other sources use exact `/{locale}/{route}.md`.
Home uses neutral `/index.md` or exact `/{locale}/index.md`, while HTML uses `/`
or `/{locale}/`. Deduplicate selected exact Markdown, extensionless Markdown,
`.html` and root `/index` HTML aliases; keep nested index identities explicit.
HTML alternates and neutral Markdown alternate/llms URLs retain their conventions.
Missing/invalid exact sources never create translated or fallback URLs.

Optional YAML boolean `indexable: false` excludes that source from sitemap and,
when neutral-selected, llms.txt, without changing public delivery or neutral selection.
Sitemap selection never expands llms.txt into a list of translations. Public Markdown
sources remain distinct by locale even with identical text. Standalone HTML pages,
layouts, includes, error presentations including `404.html`, assets, private files,
reserved endpoints, static exclusions and invalid sources remain outside generated
publication discovery. Standalone HTML needs explicit host eligibility, not a template
scan. URLs use the configured origin, are unique, sorted and XML-escaped. Mixed
format discovery does not guarantee separate search-engine indexing. See the
[discovery guide](../../docs/publications.md#discovery-and-agent-contact).

A nonempty legacy `PUBLICATION_FAMILIES` list selects families mode, preserving
reserved prefixes, family presentations, and neutral `en → default` selection.
Explicit site policy plus a nonempty legacy list is rejected. Remove the legacy
setting to migrate to site publication; new host policy belongs in code.
See the [publication guide](../../docs/publications.md) for the DI composition
example, URL matrix, source rules, and main-page handling.

## Error responses

CMS registers `Fl32_Cms_Back_Web_Handler_NotFound` after normal PROCESS handlers,
including the actual static handler. Additional host handlers must declare
`before: ['Fl32_Cms_Back_Web_Handler_NotFound']` and register before locking.
Explicit publication/static 404 outcomes use `Fl32_Cms_Back_Web_Error_Respond$`;
unavailable publications never continue into successful template/static fallback.

Optional host templates use `tmpl/web/{locale}/404.html`, with tmpl default/shared
fallback and the host-selected engine. Error language is URL locale then default,
not Accept-Language. Replace `Fl32_Cms_Back_Web_Error_Policy$` and implement
`getTemplateName({status, locale, path})` for safe section-specific `.html` names.
No per-template environment settings or required startup templates are introduced.

Branded GET/HEAD page errors retain HTTP 404 at the original URL; Markdown, API,
reserved endpoint and static misses retain non-HTML representations. Errors send
no-store and noindex headers; HEAD has no body. Templates receive only safe error
status/title, statusCode, locale and allowedLocales, without publication links or
request/configuration data. Missing/empty/unreadable/failing templates yield a
nonrecursive plain 404. Completed and closed responses are untouched. Error HTML
is outside the Markdown catalog/discovery. Generic pipeline 500 handling is unchanged.
See [custom 404 pages](../../docs/errors.md) for the complete consumer contract.

## Template engine boundary

The host application chooses the concrete template engine. The tmpl package
owns the engine contract and offers implementations; it does not expose an
engine selector. In the standalone TeqCMS host, the pre-DI configurator maps
the engine contract to the CMS adapter, and that adapter delegates to the
selected implementation using the host's `TEQFW_TMPL__ENGINE` choice. A host
embedding TeqCMS may provide its own mapping.

Do not move engine selection into CMS business components, add a package-local
configuration loader, or assume that the tmpl package selects the engine by
itself.

## Commands and lifecycle

Declare command descriptors in `package.json` under `teqfw.fw.cli.commands`.
The descriptor's `id` is the public command name. A finite command implements
`async execute(context)` and must not call `process.exit` or assign
`process.exitCode`. Lifecycle plugins expose `onStartup()` and `onShutdown()`
and must not receive the Container or Bootstrap resolver.

## Package skill distribution

This skill is distributed with the package under `skills/teqfw-cms/`. A host
with a root `.agents/skills/` catalog may mount the installed version with:

```bash
mkdir -p .agents/skills
ln -s ../../node_modules/@flancer32/teq-cms/skills/teqfw-cms .agents/skills/teqfw-cms
```

Installation must not create the link or mutate host agent configuration.
The skill is independent from TeqFW runtime metadata, DI namespaces, exports,
and plugin discovery.

## Verification

For source or integration changes, run the checks required by the host project,
normally:

- `npm test`;
- `npm run typecheck` for JavaScript, JSDoc, and ambient type
  map checking;
- `npm run validate:esm` for validated runtime source;
- `git diff --check`;
- `npm pack --dry-run` and inspect that `skills/teqfw-cms/` is included.

The root `types.d.ts` is the canonical package type map. Keep one deterministic
namespace alias for every module under the declared `Fl32_Cms_` namespace and
use aliases without CDC suffixes in JSDoc. `jsconfig.json` includes the
package's runtime source, type map, and installed TeqFW dependency type maps;
tests are verified by `npm test`, while foreign dependency source trees remain
outside the package type-check target. `maxNodeModuleJsDepth: 0` prevents
TypeScript from falling back to checking untyped JavaScript in dependencies.

When changing package behavior, verify the real CLI startup path and the
published package boundary rather than relying only on isolated DI fixtures.
