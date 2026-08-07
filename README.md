# @flancer32/teq-cms

TeqCMS is a minimalistic content management system for building and maintaining multilingual websites.  
It is file-based by design and treats content as code — stored, versioned, and deployed using standard development tools.

Localization is powered by AI and fully integrated into the content lifecycle. When a page is updated, translations are automatically synchronized using language models, without manual duplication or third-party interfaces.

This system eliminates the need for databases, admin panels, or headless infrastructure. Instead, it relies on structured directories, template rendering, and automation — providing full transparency and control over every stage of development and publishing.

TeqCMS is suitable for websites, landing pages, documentation, and developer-facing resources where clarity, consistency, and maintainability are critical. It integrates easily into existing Git workflows and can be deployed in any Node.js environment.

Learn more at: [https://cms.teqfw.com](https://cms.teqfw.com)

---

## Key Principles

- Content is managed as plain files in a structured layout.
- Translations are automated and kept in sync through AI.
- Pages are rendered server-side using standard templates.
- Deployment is simple and reproducible, with no hidden logic.

---

## Who It’s For

- Developers maintaining multilingual websites
- Teams building structured documentation or landing pages
- Projects that require versioned, file-based content with low infrastructure overhead

---

## Running TeqCMS

TeqCMS uses the standard `@teqfw/cli` host and publishes metadata-driven commands. Run the web server with `npm start` or `npm exec -- teq web:start`; run translations with `npm exec -- teq translate`.

Host applications customize the container through `teqfw.fw.cli.container.configurator` in their `package.json`. The configurator exports a default class with a `configure({applicationRoot, argv})` method and returns namespace roots, preprocessors, or postprocessors. It does not receive or construct the DI container.

```json
"teqfw": {
  "fw": {
    "cli": {
      "container": {
        "configurator": "./bootstrap/configurator.mjs"
      }
    }
  }
}
```

```js
export default class Configurator {
  configure({applicationRoot, argv}) {
    return {namespaceRoots: [], preprocessors: []};
  }
}
```

The TeqCMS configurator is kept under `bootstrap/` because `@teqfw/cli`
loads it through a dynamic import before the DI Container is resolved. It is a
pre-DI composition module and must not depend on DI services.

### Configuration

TeqCMS loads configuration sources in this order: built-in defaults, an optional
`.env` file, and process environment values. Later sources override earlier
values. Configuration keys use the TeqFW form `NAMESPACE__PARAMETER`.

Template settings belong to `@flancer32/teq-tmpl` and use the `TEQFW_TMPL`
namespace. The tmpl package offers the available engine implementations and
their common contract. TeqCMS, as the host application, owns the selection:
`TEQFW_TMPL__ENGINE` tells TeqCMS which offered implementation to bind through
DI. The tmpl package does not automatically choose the DI implementation.
CMS-specific settings use the `TEQ_CMS` namespace; web server settings use
`TEQFW_WEB`.

Legacy `TEQ_CMS_*` environment names are not supported.

---

## License

Apache-2.0 © Alex Gusev — [https://github.com/flancer64](https://github.com/flancer64)
