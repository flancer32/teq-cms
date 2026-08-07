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
```

The template package reads `TEQFW_TMPL` and owns allowed locales, default
locale, and engine choice. The web package reads `TEQFW_WEB` and owns web
server settings. Use each package's typed configuration component instead of
duplicating or forwarding raw values in CMS code.

## Precedence and boundaries

The CLI host decides which standard and application sources are loaded. The
CMS host configurator may provide host-level source descriptors when the
standalone application needs them, but CMS components do not load dotenv files
or construct cfg Sources.

`TeqFw_Cli_Config$` contains computed process facts such as `applicationRoot`,
`cwd`, normalized arguments, and dotenv details. These facts are separate from
user configuration and cannot be overridden by an environment variable.

Legacy single-underscore names such as `TEQ_CMS_BASE_URL` are unsupported.
