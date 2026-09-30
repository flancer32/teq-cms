# Error Responses

- Path: `ctx/docs/architecture/errors.md`
- Changed: `20260930`

## Ownership and Ordering

CMS owns localized 404 presentation. `Web/Error/Respond` serves both explicit
publication/static misses and the terminal `Web/Handler/NotFound` PROCESS handler.
The terminal handler uses `after` constraints for publication, ordinary templates,
static routes, the actual platform static handler, and the optional agent handler.
Hosts register additional PROCESS handlers with
`before: ['Fl32_Cms_Back_Web_Handler_NotFound']` before the pipeline locks.
The platform inline fallback and generic 500 handling remain platform responsibilities.
FINALIZE cannot replace a sent response.

An invalid/unavailable publication remains a terminal 404, never a successful
ordinary-template/static fallback. Completed, headers-sent, ended, or closed
responses are untouched, including closure while rendering. HEAD computes the
same status, representation headers and content length as GET, but sends no body.

## Presentation Contract

The default host-owned template is `tmpl/web/{locale}/404.html`, retaining the
promo host convention without migration. Primary lookup uses maintained URL locale,
otherwise tmpl default; error language deliberately ignores `Accept-Language`.
This is error presentation, distinct from existing publication language selection.
The tmpl target has type `web`, selected user locale and configured application
locale, allowing normal default-locale and shared `tmpl/web/404.html` fallback.
No template is required at startup. The host-selected engine renders the template.
Missing, unreadable, empty or failing templates produce a plain 404, without
recursive rendering. Rendering failures are logged without request/configuration
or engine-exception details in CMS error-service logs.

Hosts replace `Fl32_Cms_Back_Web_Error_Policy$` through DI. Its
`getTemplateName({status, locale, path})` returns a safe relative `.html` name or
`undefined` to disable presentation. `path` is a validated pathname without query
parameters; invalid paths become `/` for policy input and receive plain errors.
The status-oriented contract allows future extension; only 404 is implemented.
Template names contain safe alphanumeric, underscore/hyphen segments, never traversal.

Templates receive only `error: {status: 404, title: 'Not Found'}`, `statusCode`,
selected `locale`, and `allowedLocales`. There is no publication, canonical URL,
hreflang/alternate URL, request, query, configuration, internal path, or stack.
Host layouts must omit publication metadata when those values are absent.
Error `.html` templates are outside the Markdown catalog and generated discovery.
Like other files in `tmpl/web/`, they remain public; private data belongs elsewhere.

## Representation and Cache

- GET/HEAD page misses: explicit `.html` selects HTML; explicit `.md` selects
  Markdown. Extensionless requests reuse the publication Accept/User-Agent selector.
- Selected HTML may render the host template. Without usable HTML, use UTF-8
  `text/plain` with `Not Found`.
- Selected Markdown uses UTF-8 `text/markdown` with `# 404 Not Found`.
- Reserved static/discovery misses and other file-extension misses use plain text,
  even with `.html` or browser headers under a static prefix.
- `/agent/message` and `/api` or `/api/...` misses use UTF-8 JSON
  `{"error":"Not Found","status":404}`. Existing completed endpoint responses
  retain their own response contract. Other host endpoints can call the shared service
  or complete their own response before the terminal handler.
- Other methods and rejected page representations use plain errors with status 404.
  Existing publication 406 outcomes remain unchanged.

All shared-service errors remain at the original URL with HTTP 404, no redirect,
`Cache-Control: no-store` and `X-Robots-Tag: noindex, follow`. HTML uses UTF-8
`text/html`; content length describes the GET body. Negotiated page errors vary by
`Accept, User-Agent`, preserving any publication Vary entries. Error presentation
locale does not vary by language headers. Host templates should also use a matching
robots meta tag. No negative response is cached by the CMS contract.
