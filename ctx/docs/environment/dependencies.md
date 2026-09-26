# Dependency Baseline

- Path: `ctx/docs/environment/dependencies.md`
- Changed: `20260926`

The package metadata currently requires:

- `@flancer32/teq-tmpl` `<=1.0.0` for published consumers; development installs
  `flancer32/teq-tmpl#main` through `devDependencies` and the lockfile.
- `@teqfw/web` `^2.0.0`.
- `@teqfw/di` `>=2.9.0`.
- `@teqfw/log` `>=2.0.0`.
- `@teqfw/cfg` `>=2.0.0`.
- `@teqfw/cli` `>=2.4.0` for declarative host Container policy configuration.

The package requires Node.js 20 or newer.
The package uses `mustache` and `nunjucks` as runtime template engines selected by host composition.
The development lockfile resolves tmpl from its current main commit; a new
dependency install may advance it and requires compatibility verification.
With the same package declared in both dependency groups, npm marks its
lockfile entry as development-only. A source checkout installed with
`npm ci --omit=dev` therefore omits tmpl; published consumers resolve the
runtime dependency from the published package manifest.

Optional Markdown publication uses `marked` for body rendering and `yaml` for deterministic front-matter parsing. Both are runtime dependencies because a configured family can be served through the CMS web pipeline and enumerated by the CLI. Publication remains disabled until a family is configured.
