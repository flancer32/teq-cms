# Architecture Overview

TeqCMS is a Node.js ESM plugin composed around the standard `@teqfw/cli` process host.

The `teq` executable creates the DI environment. During standalone development
TeqCMS is also the host application: its configurator selects implementations
and provides configuration Sources, while its CLI plugin registers the CMS web
pipeline.

Runtime areas include configuration, web request handling, template rendering, translation orchestration, filesystem persistence, and a direct HTTP gateway for OpenAI-compatible APIs.

The current dependency migration is an explicit intermediate state: platform package versions are updated before application wiring is restored.
