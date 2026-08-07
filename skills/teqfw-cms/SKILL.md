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
web pipeline, or translation command. The host project's instructions and
current source remain authoritative; this skill describes the package-owned
boundary and the checks that protect it.

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
   the `@flancer32/teq-web` pipeline. The `fl32:web:start` command belongs to
   `@flancer32/teq-web`; the finite `cms:translate` command belongs to TeqCMS
   and is declared in `package.json` metadata.

## Configuration ownership

The CLI host supplies the standard configuration sources and loads them once
before plugins and commands are resolved. TeqFW cfg owns the raw immutable
snapshot; each package owns its typed projection through
`TeqFw_Cfg_Reader$`.

TeqCMS owns only the `TEQ_CMS` namespace:

- `TEQ_CMS__BASE_URL` — canonical public base URL;
- `TEQ_CMS__AI_API_BASE_URL` — OpenAI-compatible API base URL;
- `TEQ_CMS__AI_API_KEY` — API credential;
- `TEQ_CMS__AI_API_MODEL` — model name, defaulting to `gpt-4o-mini`;
- `TEQ_CMS__AI_API_ORG` — optional organization identifier;
- `TEQ_CMS__LOCALE_BASE_TRANSLATE` — translation source locale, defaulting to
  `ru`.

Template settings belong to `@flancer32/teq-tmpl` under `TEQFW_TMPL`.
Web-server settings belong to `@flancer32/teq-web` under `TEQFW_WEB`.
Do not add CMS aliases for those settings, read `process.env` in runtime
components, or reintroduce the removed `TEQ_CMS_*` single-underscore names.
The application root is a CLI runtime fact from `TeqFw_Cli_Config$`, not a CMS
or template configuration setting.

## Template engine boundary

The host application chooses the concrete template engine. The tmpl package
owns the engine contract and offers implementations; it exposes the typed
`TEQFW_TMPL__ENGINE` choice but does not automatically bind a DI implementation
from that value. In the standalone TeqCMS host, the pre-DI configurator maps
the engine contract to the CMS adapter, and that adapter delegates to the
selected implementation. A host embedding TeqCMS may provide its own mapping.

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
- `teqfw-esm-validator src --profile base` for validated runtime source;
- `npx tsc -p jsconfig.json` when JSDoc contracts or type declarations change;
- `git diff --check`;
- `npm pack --dry-run` and inspect that `skills/teqfw-cms/` is included.

When changing package behavior, verify the real CLI startup path and the
published package boundary rather than relying only on isolated DI fixtures.
