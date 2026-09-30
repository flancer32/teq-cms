# Architecture Constraints

- Path: `ctx/docs/architecture/constraints.md`
- Changed: `20260930`

- `@teqfw/cli` owns process composition and container creation; TeqCMS provides
  its host configurator, lifecycle plugin, and declared metadata.
- Internal components depend on DI tokens rather than host implementation paths.
- Host applications customize the CMS through the public configurator boundary.
- The host application selects the configured `@flancer32/teq-tmpl` engine through
  its composition boundary.
- Publication policy, source selection, and agent discovery remain CMS responsibilities; platform packages retain their infrastructure and template contracts.
- Publication locale configuration belongs to `@flancer32/teq-tmpl`; TeqCMS uses its default locale for the source fallback and defines no separate agent locale setting.
- Publication representation selection depends on the resource URL and remains independent of client identity. Existing non-publication HTML template behavior is unaffected.
