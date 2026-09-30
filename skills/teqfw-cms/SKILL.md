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
- `TEQ_CMS__PUBLICATION_FAMILIES` — explicitly enabled route families;
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

Family prefixes cannot overlap or begin with a maintained locale code.
Configured families expose `/{prefix}/{route}` as canonical raw Markdown and
`/{locale}/{prefix}/{route}` as exact-locale server-rendered HTML. For example:

```text
/docs/foo       → canonical raw Markdown, source preference en → default
/docs/foo.md    → neutral Markdown alias
/en/docs/foo.md → exact English Markdown
/en/docs/foo    → canonical English HTML
/en/docs/foo.html → English HTML alias
/docs/foo.html  → HTML from the exact tmpl default locale
```

Read sources at `tmpl/web/{locale}/{prefix}/{route}.md`. Agents maintain locale
variants directly; TeqCMS does not translate or call an LLM API. The neutral
resource prefers the maintained `en` source, then tmpl's default locale, then
404. English need not be the human default. Localized HTML returns 404 when
its exact source or readable, nonempty presentation template is absent. Localized `.md` serves the exact valid source without a presentation. Localized `.html` renders that same source; neutral `.html` uses only the maintained tmpl default locale and returns 404 if it or its valid source is absent. HTTP removes one terminal lowercase representation suffix before strict logical-route validation; Source APIs remain extensionless. Routing is
independent of User-Agent and client identity and preserves ordinary HTML
routes. Markdown includes the authored front matter.

Presentation data supplies the HTML projection's `canonicalUrl`,
`alternateUrls` for available localized HTML, and `markdownAlternateUrl` for
the neutral resource when available. HTML links and the sitemap share the
presentation availability check with HTTP; neutral discovery is independent
of presentation availability. `llms.txt` lists each neutral resource
once; the sitemap lists available localized HTML independently. Canonical and HTML alternate links stay extensionless for every alias; discovery omits suffix aliases, neutral HTML aliases, and localized Markdown URLs. Source and
catalog share source selection with HTTP and discovery. See the published
[publication guide](../../docs/publications.md) for configuration and templates.

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
