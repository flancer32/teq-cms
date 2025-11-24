# teqcms-composition-root

- **Goal:** Bring `bin/teq-cms.mjs` into full compliance with `ctx/rules/arch/bin/teq-cms.md`, covering namespace roots, DI composition, preprocessors, and configuration loading invariants.
- **Actions:** Rebuilt the composition root to detect the project root safely, dynamically create the DI container, and register all required namespace roots (Fl32_Cms_, Fl32_Tmpl_, Fl32_Web_, TeqFw_Di_) before resolving `TeqFw_Di_Pre_Replace$`; wired the Replace preprocessor to swap the CMS adapter and choose the templating engine per environment and injected it into the container’s preprocessor chain; preserved the pluggable configuration loading path for `teqcms.config.js` or the `package.json` section without touching CMS or DI internals.
- **Artifacts:** `bin/teq-cms.mjs`
