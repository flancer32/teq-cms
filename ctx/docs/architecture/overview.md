# Architecture Overview

- Path: `ctx/docs/architecture/overview.md`
- Changed: `20260923`

TeqCMS is a Node.js ESM plugin composed around the standard `@teqfw/cli` process host.

The `teq` executable creates the DI environment. During standalone development
TeqCMS is also the host application: its configurator selects implementations
and provides configuration Sources, while its CLI plugin registers the CMS web
pipeline.

Runtime areas include configuration, web request handling, template rendering, translation orchestration, filesystem persistence, and a direct HTTP gateway for OpenAI-compatible APIs.

Optional Markdown publication is a CMS-owned area. It reads opted-in localized sources, exposes a deterministic catalog, renders human pages through the selected tmpl engine, and serves source Markdown and discovery only under the configured machine-locale policy. See `publication.md`.

The standalone host currently starts through `@teqfw/cli`, and the CMS lifecycle plugin registers its handlers before `@teqfw/web` locks the pipeline.
