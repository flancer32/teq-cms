# TeqCMS Configuration

Configuration is loaded by the CLI host before lifecycle plugins and commands
are resolved. TeqFW cfg builds the raw snapshot from ordered sources. Runtime
components then use their package-owned typed configuration projections through
`TeqFw_Cfg_Reader$`.

## Namespaces

TeqCMS reads only `TEQ_CMS` in `Fl32_Cms_Back_Config`:

```text
TEQ_CMS__BASE_URL
TEQ_CMS__AI_API_BASE_URL
TEQ_CMS__AI_API_KEY
TEQ_CMS__AI_API_MODEL
TEQ_CMS__AI_API_ORG
TEQ_CMS__LOCALE_BASE_TRANSLATE
TEQ_CMS__PUBLICATION_FAMILIES
TEQ_CMS__PUBLICATION_MACHINE_LOCALES
TEQ_CMS__PUBLICATION_DISCOVERY_PATH
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

`PUBLICATION_FAMILIES` is a JSON array of `{prefix, presentation}` objects and defaults to an empty array, leaving Markdown publication disabled. `PUBLICATION_MACHINE_LOCALES` is a comma-separated locale list and defaults to empty. `PUBLICATION_DISCOVERY_PATH` defaults to `/llms.txt`. Configured publication requires an absolute `BASE_URL` without a path. The machine locales must be included in the template package's available human locales; they are independent of `LOCALE_BASE_TRANSLATE` and `TEQFW_TMPL__DEFAULT_LOCALE`. See `docs/publications.md` in the package for the full host guide.
