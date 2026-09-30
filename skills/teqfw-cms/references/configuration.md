# TeqCMS Configuration

Configuration is loaded by the CLI host before lifecycle plugins and commands
are resolved. TeqFW cfg builds the raw snapshot from ordered sources. Runtime
components then use their package-owned typed configuration projections through
`TeqFw_Cfg_Reader$`.

## Namespaces

TeqCMS reads only `TEQ_CMS` in `Fl32_Cms_Back_Config`:

```text
TEQ_CMS__BASE_URL
TEQ_CMS__SITEMAP_REPRESENTATIONS
TEQ_CMS__PUBLICATION_FAMILIES
TEQ_CMS__AGENT_MESSAGE_ENABLED
TEQ_CMS__AGENT_MESSAGE_TOKEN
```

The template package reads `TEQFW_TMPL` and owns allowed locales and the default
locale. The standalone CMS host reads `TEQFW_TMPL__ENGINE` through the cfg
reader to select an engine implementation; tmpl does not project this key.
The web package reads `TEQFW_WEB` and owns web server settings. Runtime
components use each package's typed configuration component.

## Precedence and boundaries

The CLI host decides which standard and application sources are loaded. The
CMS host configurator may provide host-level source descriptors when the
standalone application needs them, but CMS components do not load dotenv files
or construct cfg Sources.

`TeqFw_Cli_Config$` contains computed process facts such as `applicationRoot`,
`cwd`, normalized arguments, and dotenv details. These facts are separate from
user configuration and cannot be overridden by an environment variable.

Legacy single-underscore names such as `TEQ_CMS_BASE_URL` are unsupported.

`PUBLICATION_FAMILIES` is a JSON array of `{prefix, presentation}` objects and defaults to an empty array, selecting the default site-wide publication mode. It is retained for legacy selected-section hosts; new route policy is provided in host code through `Fl32_Cms_Back_Publication_Policy$`. Prefixes cannot overlap or begin with a maintained tmpl locale code; the latter is reserved for localized URLs. Configured publication requires an absolute `BASE_URL` without a path. Source locales come from the template package's available locales. Extensionless formats are selected by Accept, then User-Agent, with HTML as default; explicit `.md`/`.html` overrides headers. Site-wide neutral Markdown source selection prefers unlocalized, then maintained `en`, then tmpl default; legacy families retain `en` then default. HTML language uses explicit URL locale, then supported Accept-Language, then tmpl default, including neutral `.html`. Neutral HTML in site mode prefers authored unlocalized content; otherwise it requires the exact selected human locale source. No CMS agent-locale configuration is needed. `AGENT_MESSAGE_ENABLED` defaults to false. See `docs/publications.md` in the package for the full host guide.

`SITEMAP_REPRESENTATIONS` accepts `html` (default), `markdown`, or `both`; invalid
values are rejected. It selects discovery formats without changing routing or HTML
canonical links. Markdown discovery retains the explicit neutral `.md` URL for its
selected source and exact locale `.md` for other sources, independently of HTML
availability. llms.txt remains neutral-only. Optional YAML boolean `indexable: false`
in source front matter excludes its generated discovery entries, retaining public
routing and source preference. Regenerate with `teq cms:generate` after changes.
