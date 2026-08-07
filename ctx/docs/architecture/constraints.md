# Architecture Constraints

- `@teqfw/cli` owns process composition and container creation; TeqCMS provides
  its host configurator, lifecycle plugin, and declared metadata.
- Internal components depend on DI tokens rather than host implementation paths.
- Host applications customize the CMS through the public configurator boundary.
- The host application selects the configured `@flancer32/teq-tmpl` engine through
  its composition boundary.
- Dependency migration and runtime recovery are separate checkpoints.
- Legacy integration behavior must not be silently reinterpreted during dependency switching.
