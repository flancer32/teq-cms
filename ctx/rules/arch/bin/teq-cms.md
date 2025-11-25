# `bin/teq-cms.mjs`: Composition Root Rules (short version)

## Purpose

`bin/teq-cms.mjs` is the single entry point for creating the DI environment of TeqCMS.
This is where namespace roots are registered, preprocessors are attached, the application configuration is loaded, and the CMS CLI command is executed.

---

## 1. Mandatory Namespace Spaces

| Namespace    | Purpose              | Path                                             | Conditions                |
| ------------ | -------------------- | ------------------------------------------------ | ------------------------- |
| `Fl32_Cms_`  | CMS core             | `node_modules/@flancer32/teq-cms/src` or `./src` | auto: package/development |
| `Fl32_Tmpl_` | templates            | `node_modules/@flancer32/teq-tmpl/src`           | fixed path                |
| `Fl32_Web_`  | web infrastructure   | `node_modules/@flancer32/teq-web/src`            | fixed path                |
| `TeqFw_Di_`  | DI and preprocessors | `node_modules/@teqfw/di/src`                     | required                  |

Invariant: `TeqFw_Di_Pre_Replace$` must be available through DI → the `TeqFw_Di_` namespace is always registered.

---

## 2. Mapping Rules

### 2.1. `Fl32_Cms_`

- if the package is installed — use its `src`;
- otherwise — use the local `./src`.

### 2.2. Other Namespaces

`Fl32_Tmpl_`, `Fl32_Web_`, and `TeqFw_Di_` are always mapped from `node_modules`.

### 2.3. Constant Set

The set of namespace roots is fixed; the composition root does not generate dynamic or conditional namespace spaces.

---

## 3. Preprocessors

- getting `TeqFw_Di_Pre_Replace$`;
- registering CMS overrides;
- selecting the template engine via an environment variable;
- adding the Replace preprocessor to the global DI pipeline.

---

## 4. Application Configuration

TeqCMS first looks for a module that can configure the application. It attempts the files in this order:

1. `./teqcms.config.mjs` (preferred, as it retains native ES module semantics);
2. `./teqcms.config.js`.

If both are present, `.mjs` is used and `.js` is ignored.

Alternatively, specify `"teqcms": { "configure": "path/to/module.mjs" }` in `package.json`. The configured path is resolved relative to the project root and may point to either `.mjs` or `.js`, but `.mjs` should be used when available.

Format:

```js
export default async function configure({ resolver, replace }) {}
```

Allowed actions: adding application namespace roots, registering replacements.
Forbidden: direct imports of CMS or DI internals.

---

## 5. Project Root Detection

Correct directory ascent:

```js
dir = dirname(dir);
```

The variant `dirname(join(dir, '..'))` is not allowed: it may move up two levels unintentionally.

---

## 6. Composition Root Invariants

- the container is created exactly once — only here;
- namespace roots are declared only in `bin/teq-cms.mjs`;
- no static imports of internal CMS modules;
- preprocessors are connected via DI;
- application extensions must go through the configurator only.

---

## 7. Script Executability

`bin/teq-cms.mjs` is a CLI command and must be an executable file.

Requirements:

- mandatory shebang:

  ```js
  #!/usr/bin/env node
  ```

- the file must be executable (`chmod +x bin/teq-cms.mjs`);

- npm publication must preserve the executable bit.

Invariant: missing execute permission results in `Permission denied` when running via `npm run` or `npx`.
