# Dependency Baseline

- Path: `ctx/docs/environment/dependencies.md`
- Changed: `20260923`

The package metadata currently requires:

- `@flancer32/teq-tmpl` `<=1.0.0`.
- `@teqfw/web` `^2.0.0`.
- `@teqfw/di` `^2.9.0`.
- `@teqfw/log` `^2.0.0`.
- `@teqfw/cfg` `^2.0.0`.
- `@teqfw/cli` `>=2.1.0`.

The package requires Node.js 20 or newer.
The package uses `mustache` and `nunjucks` as runtime template engines selected by host composition.

Optional Markdown publication uses `marked` for body rendering and `yaml` for deterministic front-matter parsing. Both are runtime dependencies because a configured family can be served through the CMS web pipeline and translated by the CLI. Publication remains disabled until a family is configured.
