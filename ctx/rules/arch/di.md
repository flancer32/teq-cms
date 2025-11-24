# DI Usage Rules in TeqCMS

## 1. General Principles

TeqCMS uses the `@teqfw/di` container as the sole mechanism for linking modules.
All dependencies are resolved using namespace identifiers without static imports.
The container is created once — in the composition root (`bin/teq-cms.js`) — and must not be accessed directly anywhere else.

## 2. Composition Root

`bin/teq-cms.js` is the only point where the Dependency Graph is assembled.
It performs the following:

1. creates the container;
2. registers namespace roots for the CMS;
3. installs preprocessors (`Replace` and others);
4. loads user configuration;
5. launches CMS commands.

All DI-environment modifications must occur exclusively here.

## 3. Extending the CMS in External Applications

Applications using TeqCMS can customize the CMS through the public configuration mechanism.
Two formats are supported:

1. a `teqcms.config.js` file;
2. a `"teqcms"` section in `package.json`.

Both must export a function of the following form:

```js
export default async function configure({ resolver, replace }) {}
```

This function allows:

- adding application namespace roots;
- overriding CMS implementations via `replace.add(...)`;
- registering custom adapters, services, and handlers.

Direct access to the container is not allowed.

### Example: configuration via `package.json`

```json
{
  "name": "my-app",
  "dependencies": {
    "@flancer32/teq-cms": "^1.0.0"
  },
  "teqcms": {
    "configure": "./src/cms/setup.js"
  }
}
```

File `./src/cms/setup.js`:

```js
export default async function configure({ resolver, replace }) {
  resolver.addNamespaceRoot("App_", "./src");
  replace.add("Fl32_Cms_Back_Api_Adapter", "App_Cms_Custom_Adapter");
}
```

## 4. Restrictions

- The CMS must not depend on application code.
- The application must not access the container outside the composition root.
- Internal modules may obtain dependencies only through DI identifiers.
- The configurator must not include static imports from the CMS.

## 5. Purpose

To preserve a strict, predictable, and reproducible architecture: the CMS remains an isolated core, while extensibility is controlled through DI configuration in the composition root.
