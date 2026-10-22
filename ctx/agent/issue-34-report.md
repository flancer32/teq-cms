# Issue #34 Implementation Report

- Date: 2026-10-22
- Issue: https://github.com/flancer32/teq-cms/issues/34
- Baseline: `d1da491` on `main`, synchronized with `origin/main` at task start.
- Scope extension: repair JSDoc validation errors, explicitly requested by the user.

## Applicability and Analysis

The issue belongs to TeqCMS. Version 0.10.0's publication representation selector
matches TelegramBot and Twitterbot through its generic `bot` heuristic, returning
Markdown when Accept is absent, wildcard-only or tied. Social preview clients need
the host's SSR HTML to inspect Open Graph and Twitter Card tags.
The defect is in CMS representation selection, independent of host metadata or images.

## Action Plan and Completion

1. Update authoritative product, architecture, code and agent orientation context
   to distinguish social preview consumers from generic Markdown agents. Completed.
2. Recognize a bounded list of known social crawlers before the generic agent
   heuristic, after explicit suffixes, Accept weights and exclusions. Completed.
3. Add classifier regressions and extend the existing real CLI/HTTP fixture to
   check canonical home previews, metadata, overrides and AI/CLI behavior. Completed.
4. Update the publication usage guide, distributed consumer skill and changelog,
   including a deployment verification command and preview-cache limitation. Completed.
5. Repair JSDoc syntax while preserving types and runtime behavior, and record
   the supported convention in verification context. Completed.
6. Run the checklist below and record results. Completed.

## Implementation

`src/Back/Publication/Representation.mjs` recognizes TelegramBot, Twitterbot,
facebookexternalhit, Facebot, LinkedInBot, Slackbot, Discordbot, WhatsApp,
Pinterestbot and SkypeUriPreview case-insensitively. These clients receive HTML
only when supported Accept preferences leave the format undecided.
Explicit suffixes, Accept weights and q=0 exclusions retain precedence.
Other recognized bots and AI/CLI consumers retain their Markdown fallback.
No production dependency or site-specific routing setting was introduced.

`test/unit/Back/Publication/Representation.test.mjs` tests all listed social
clients with missing, wildcard, unsupported and tied Accept, weighted explicit
preferences, q=0 and both suffixes. AI/CLI and unknown-client cases remain covered.

`test/accept/ErrorHttp.test.mjs` reuses actual `web:start` startup, a temporary
host, Nunjucks and loopback HTTP. The host supplies an unlocalized home source
and SSR OG/Twitter tags. Requests to `/` verify status, Content-Type, metadata,
canonical identity, Vary and absence of redirects. Additional requests cover
explicit formats and Markdown for ChatGPT/GPTBot/ClaudeBot/curl/wget/generic bots.

The installed ESM validator initially reported 52 JSDoc violations, identical on
unchanged HEAD. Runtime annotations now use Array<T>, canonical union/literal/
callback aliases in `types.d.ts`, and `any` instead of the equivalent wildcard
syntax. Package-level checking additionally identified Error and Function
references: these now use named contracts, with the preprocessor callback typed
precisely. The canonical map is sorted. No runtime logic changed in these repairs.

## Verification Checklist

- [x] Reproduce social-classifier failure before applying the fix.
- [x] Telegram/Twitter and other listed previews get HTML for ambiguous Accept.
- [x] Missing, wildcard, tied and unsupported Accept cases covered at unit level.
- [x] AI/CLI/generic agents retain Markdown for ambiguous requests.
- [x] Browsers, facebookexternalhit and unknown clients retain HTML defaults.
- [x] Explicit Accept weights and q=0 exclusions override client classification.
- [x] Explicit .md/.html override conflicting headers.
- [x] Real HTTP `/` serves SSR OG/Twitter tags with the canonical `/` identity.
- [x] Content-Type, Vary and absence of redirects verified through HTTP.
- [x] Existing publication, language, discovery and error regressions pass.
- [x] `npm test`: 60 unit tests and 22 acceptance tests passed; no failures/skips.
- [x] `npm run typecheck`: passed.
- [x] `npm run validate:esm`: valid, zero violations under `src/`.
- [x] `teqfw-esm-validator . --profile base`: valid, zero violations including
  package type map and configured dependency aliases.
- [x] `npm pack --dry-run --cache /tmp/teq-cms-npm-cache`: passed; consumer skill,
  usage guide and types are present in the package payload.
- [x] `git diff --check`: passed.

## Environment and Remaining Limits

The sandbox initially prevented local sockets and the validator's child process.
Checks passed when rerun with the required execution permissions.
The declared dev dependency `@xmldom/xmldom@0.9.12` was absent locally; its registry
archive matching the lockfile integrity was restored into ignored node_modules.
Neither package.json nor package-lock.json changed.

Tests use a temporary local host. No deployment or live pde.network changes were
performed. HTML delivery exposes existing metadata; host metadata/image quality
and Telegram/X preview-cache refresh remain outside this representation fix.
The crawler list is a delivery heuristic and may require future additions.

After reviewing the implementation, the user authorized committing and pushing
the changes to main, posting a commit-linked issue comment, and closing issue #34.
The issue comment records the resulting commit URL.

## Changed Files

- `CHANGELOG.md`
- `ctx/docs/ai-intro.md`
- `ctx/docs/architecture/publication.md`
- `ctx/docs/code/publication.md`
- `ctx/docs/code/verification.md`
- `ctx/docs/product/overview.md`
- `docs/publications.md`
- `skills/teqfw-cms/SKILL.md`
- `src/Back/Api/Adapter.mjs`
- `src/Back/Config.mjs`
- `src/Back/Di/Preprocessor.mjs`
- `src/Back/Discovery/Generator.mjs`
- `src/Back/Helper/Cast.mjs`
- `src/Back/Helper/File.mjs`
- `src/Back/Helper/Web.mjs`
- `src/Back/Publication/Catalog.mjs`
- `src/Back/Publication/Handler.mjs`
- `src/Back/Publication/Policy.mjs`
- `src/Back/Publication/Representation.mjs`
- `src/Back/Publication/Routing.mjs`
- `src/Back/Publication/Source.mjs`
- `src/Back/Web/Error/Policy.mjs`
- `src/Back/Web/Error/Respond.mjs`
- `test/accept/ErrorHttp.test.mjs`
- `test/unit/Back/Publication/Representation.test.mjs`
- `types.d.ts`
- `ctx/agent/issue-34-report.md` (this report)
