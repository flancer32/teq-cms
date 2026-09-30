# Custom 404 Pages

Create `tmpl/web/en/404.html` and `tmpl/web/ru/404.html` using your selected template
engine and ordinary shared layouts. No CMS environment key or startup template is
required. Existing promo templates at these locations need no migration.

CMS renders a missing page directly at its original URL with HTTP **404**. It does
not redirect to `/404`. Error language uses a maintained locale in the URL, then
`TEQFW_TMPL__DEFAULT_LOCALE`; `Accept-Language` does not select error language.
Normal template lookup can fall back to the default-locale template and then shared
`tmpl/web/404.html`. Existing publication language selection remains independent.

The template receives:

| Value | Meaning |
| --- | --- |
| `error.status`, `statusCode` | `404` |
| `error.title` | `Not Found` |
| `locale` | URL locale or configured default |
| `allowedLocales` | Maintained tmpl locales |

There is no `publication`, `canonicalUrl`, `alternateUrls` or `markdownAlternateUrl`.
Guard these values in shared layouts so nonexistent content has no publication links.
Add `<meta name="robots" content="noindex, follow">` to your error layout. CMS also
sends `X-Robots-Tag: noindex, follow` and `Cache-Control: no-store`. Error HTML is
excluded from the Markdown catalog, llms.txt and sitemap.xml. Templates remain public
like other files under `tmpl/web/`; keep private material outside that tree.

## Formats and Fallback

- Browser GET/HEAD page errors may use the branded HTML template.
- `.html` forces HTML eligibility and `.md` forces Markdown. Extensionless errors
  reuse publication `Accept`, then `User-Agent` classification.
- Markdown errors return `text/markdown` and `# 404 Not Found`.
- Missing static prefixes, discovery files and other file extensions return plain
  `Not Found`, including missing `/assets/example.html`.
- Unhandled `/agent/message`, `/api`, and `/api/...` return JSON with
  `{"error":"Not Found","status":404}`. Completed endpoints keep their responses.
- Other methods, invalid paths and rejected representations use plain 404 responses.
- Missing, unreadable, empty or failing HTML templates fall back once to UTF-8 plain
  `Not Found`. Rendering failures are logged. No template failure prevents startup.
- HEAD has GET status/headers and content length, with no response body.

All these error responses retain status 404. Invalid or unavailable publications
cannot become successful ordinary templates or static fallback responses.

## Host Customization

Replace `Fl32_Cms_Back_Web_Error_Policy$` through your host DI preprocessor, using
the same composition mechanism as publication policy. The replacement implements:

```js
getTemplateName({status, locale, path}) {
    if (status !== 404) return undefined;
    return path.startsWith('/docs/') ? 'errors/docs-404.html' : '404.html';
}
```

`path` is a safe pathname without query parameters. Return a safe relative `.html`
name with alphanumeric, underscore/hyphen path segments, or `undefined` for plain
errors. Names cannot contain traversal or absolute paths. Lookup/rendering uses
`@flancer32/teq-tmpl` and the host-selected engine; no Nunjucks-specific CMS policy
is required. Status is part of the contract, but CMS currently supports only 404.

Register additional host PROCESS handlers before pipeline locking, with ordering
metadata `before: ['Fl32_Cms_Back_Web_Handler_NotFound']`. The terminal handler
runs after publication, ordinary templates, static routes, the actual static handler,
and enabled agent processing. Completed/sent/closed responses are untouched.
For explicit host failures, inject `Fl32_Cms_Back_Web_Error_Respond$` and call
`await errors.send({context, status: 404})`; use `kind: 'static'` for literal-resource
misses. Complete custom endpoint responses before the terminal handler when your
endpoint requires a different error format. Generic pipeline 500 handling is outside
this error presentation contract.
