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

TeqCMS uses the standard `@teqfw/cli` host and publishes metadata-driven commands. Run the web server with `npm start` or `npm exec -- teq fl32:web:start`; run translations with `npm exec -- teq translate`.

During standalone development TeqCMS is also the host application: its
pre-DI configurator selects CMS implementations, while its CLI plugin loads cfg
and registers the CMS web pipeline. Embedded hosts may provide the same
platform composition responsibilities externally.

### Configuration

The CLI plugin loads configuration sources before command resolution. TeqCMS
configuration components read detached namespace fragments through
`TeqFw_Cfg_Reader$` and convert them into typed settings. Configuration keys use
the TeqFW form `NAMESPACE__PARAMETER`.

Template settings belong to `@flancer32/teq-tmpl` and use the `TEQFW_TMPL`
namespace. The tmpl package owns the typed configuration and offers the engine
implementations. The platform host owns configuration loading and final DI
composition from `TEQFW_TMPL__ENGINE`.
CMS-specific settings use the `TEQ_CMS` namespace; web server settings use
`TEQFW_WEB`.

Legacy `TEQ_CMS_*` environment names are not supported.

Translation uses the OpenAI-compatible HTTP API directly. Configure
`TEQ_CMS__AI_API_BASE_URL`, `TEQ_CMS__AI_API_KEY`, and
`TEQ_CMS__AI_API_MODEL`; the application sends streaming requests to
`<base-url>/chat/completions` and does not require the `openai` npm package.

---

## License

Apache-2.0 © Alex Gusev — [https://github.com/flancer64](https://github.com/flancer64)
