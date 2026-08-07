# Architecture Overview

TeqCMS is a Node.js ESM plugin composed around the standard `@teqfw/cli` process host.

The `teq` executable creates the DI environment. TeqCMS contributes namespace metadata, a host configurator, a configuration-loading CLI plugin, and static command descriptors.

Runtime areas include configuration, web request handling, template rendering, translation orchestration, filesystem persistence, and the OpenAI gateway.

The current dependency migration is an explicit intermediate state: platform package versions are updated before application wiring is restored.
