# Code Verification

- Path: `ctx/docs/code/verification.md`
- Changed: `20260926`

The current project checks are:

- `npm run test:unit` — unit tests.
- `npm run test:accept` — acceptance tests.
- `npm test` — unit and acceptance tests through the built-in Node.js test runner.
- `npm run typecheck` — JavaScript type checking for the
  runtime, package type map, and linked TeqFW dependency contracts.
- `npm run validate:esm` — structural validation of TeqFW
  ESM modules under `src/`.
- `teqfw-platform .` — source-to-unit-test topology validation.
- `adsm-ctx validate .` — cognitive-context structure validation.

Representation tests verify explicit suffix priority, supported Accept weights and rejection, User-Agent hints, and the HTML default. HTML language tests verify URL precedence, weighted and regional Accept-Language, default fallback, rejection of unavailable selected content, and stable neutral Markdown. Site-publication tests verify negotiated home and localized delivery, `Vary`, and explicit Markdown discovery links, and exercise real tmpl rendering, the ordinary template adapter, static-file delivery, host policy, root priority, and HTTP/discovery agreement. CLI tests verify host DI substitution as well as legacy-family generation. Publication and agent-message acceptance tests exercise the CMS plugin with the real web pipeline. Generator unit tests verify discovery output and refusal to replace symlink targets. A local `web:start` smoke check can verify the CLI host, template engine, static delivery, and HTTP content types when sockets are available.

Error tests cover terminal ordering independent of registration order, host handlers
before the terminal handler, URL/default error locales, template default/shared
fallback, safe data, Markdown/API/static misses, unavailable publication protection,
no-template/empty/unreadable/failing rendering, HEAD and closure during rendering.
Real CLI HTTP integration starts a temporary host on a random loopback port and
checks ordinary pages, publications, static delivery and errors using the host-selected
Nunjucks engine. This acceptance test requires permission to bind local sockets.
Error HTML is absent from llms.txt and sitemap.xml.
