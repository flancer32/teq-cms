# Architecture Overview

- Path: `ctx/docs/architecture/overview.md`
- Changed: `20260930`

TeqCMS is a Node.js ESM plugin composed around the standard `@teqfw/cli` process host.

The `teq` executable creates the DI environment. During standalone development
TeqCMS is also the host application: its configurator selects implementations,
while its CLI plugin registers the CMS web pipeline. The CLI host loads
configuration Sources before resolving those components.

Runtime areas include configuration, web request handling, template rendering, publication discovery, and a private file inbox for optional agent messages.

Markdown publication is a CMS-owned area. By default it reads the public unlocalized and localized template tree without family registration; a host-owned DI policy defines presentation and static-only prefixes. Legacy configured families remain supported. It exposes a deterministic catalog, renders human pages through the selected tmpl engine, and exposes a locale-neutral Markdown resource for each publication with an eligible source. The CLI generates static discovery files. See [publication.md](publication.md).

The standalone host currently starts through `@teqfw/cli`, and the CMS lifecycle plugin registers its handlers before `@teqfw/web` locks the pipeline.

CMS [error responses](errors.md) share localized presentation between explicit
404 paths and a terminal PROCESS handler, preserving status and routing safety.
