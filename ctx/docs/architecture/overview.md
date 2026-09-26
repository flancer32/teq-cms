# Architecture Overview

- Path: `ctx/docs/architecture/overview.md`
- Changed: `20260926`

TeqCMS is a Node.js ESM plugin composed around the standard `@teqfw/cli` process host.

The `teq` executable creates the DI environment. During standalone development
TeqCMS is also the host application: its configurator selects implementations,
while its CLI plugin registers the CMS web pipeline. The CLI host loads
configuration Sources before resolving those components.

Runtime areas include configuration, web request handling, template rendering, publication discovery, and a private file inbox for optional agent messages.

Optional Markdown publication is a CMS-owned area. It reads opted-in localized sources, exposes a deterministic catalog, renders human pages through the selected tmpl engine, and serves source Markdown only under the configured machine-locale policy. The CLI generates static discovery files. See `publication.md`.

The standalone host currently starts through `@teqfw/cli`, and the CMS lifecycle plugin registers its handlers before `@teqfw/web` locks the pipeline.
