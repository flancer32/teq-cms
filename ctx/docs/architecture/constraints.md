# Architecture Constraints

- `@teqfw/cli` owns process composition and container creation; TeqCMS contributes only its declared metadata and host configurator.
- Internal components depend on DI tokens rather than host implementation paths.
- Host applications customize the CMS through the configurator boundary.
- TeqCMS is the host application for `@flancer32/teq-tmpl` and selects its
  configured engine through the host DI preprocessor.
- Dependency migration and runtime recovery are separate checkpoints.
- Legacy integration behavior must not be silently reinterpreted during dependency switching.
