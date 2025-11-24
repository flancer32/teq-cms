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

## Configuring TeqCMS in External Applications

TeqCMS lets host applications register their DI customizations during startup. Drops a `teqcms.config.js` file into the project root or adds a `"teqcms"` entry to `package.json` that points to a configurator module. TeqCMS loads the module before running any CLI commands and invokes its default export with `{ resolver, replace }`, so the application can add namespace roots or swap implementations without touching the container directly.

```json
"teqcms": {
  "configure": "./src/cms/setup.js"
}
```

```js
export default async function configure({ resolver, replace }) {
  resolver.addNamespaceRoot('App_', './src');
  replace.add('Fl32_Cms_Back_Api_Adapter', 'App_Cms_Custom_Adapter');
}
```

---

## License

Apache-2.0 © Alex Gusev — [https://github.com/flancer64](https://github.com/flancer64)
