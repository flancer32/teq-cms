# @flancer32/teq-cms

![npms.io](https://img.shields.io/npm/dm/@flancer32/teq-cms)

> **Human-governed. Agent-built. Agent-ready.**

`@flancer32/teq-cms` is a CMS built around agents and Markdown. Agents read, create, maintain, and translate version-controlled Markdown content directly. Human-facing web pages are derived HTML projections of that content. The CMS also publishes locale-neutral raw Markdown for agents. It is built on the Tequila Framework ([TeqFW](https://teqfw.com/)) and ships with a version-matched Agent Skill.

## Why use it

TeqCMS keeps Markdown sources, explicit locale variants, and presentation templates in the project filesystem and Git. It needs no database or admin panel, so content remains transparent, reviewable, and reproducible.

It is a good fit for multilingual websites, landing pages, documentation, and developer-facing resources.

## Quick start

```sh
git clone https://github.com/flancer32/teq-cms.git
cd teq-cms
npm install
npm start
```

The package uses the standard `@teqfw/cli` host. The web server is available as `web:start`; `cms:generate` writes discovery files to the host's `web/` directory.

Configure the CMS with the `TEQ_CMS__*` namespace. Template-engine settings belong to `@flancer32/teq-tmpl`, and web-server settings belong to `@teqfw/web`. Agents maintain localized source files directly; the CMS does not call an LLM API.

Learn more at [cms.teqfw.com](https://cms.teqfw.com).

## Markdown publications

Everything under `tmpl/web/` is public. Markdown publication spans the site by default, without route-family registration. Agents maintain unlocalized and locale-specific sources directly in Git:

```text
/about          → neutral Markdown: unlocalized → en → default
/about.md       → neutral Markdown alias
/en/about.md    → exact English Markdown
/en/about       → canonical English HTML
/en/about.html  → English HTML alias
/about.html     → HTML from the exact maintained default locale
/               → neutral index.md resource
/en/            → English index.md projection
```

Markdown takes priority over ordinary templates, then static files in `web/`, then 404. A found invalid source or unavailable requested representation returns 404. Static prefixes such as `/assets/` bypass templating and use only `web/assets/`; missing files return 404.

The host defines static prefixes and presentation selection in code by substituting `Fl32_Cms_Back_Publication_Policy$` through DI. The default presentation is `publication.html`. Localized content is exact; presentation templates may use normal tmpl fallback. Markdown includes front matter. HTML canonical/alternate links and generated discovery omit aliases.

A nonempty legacy `PUBLICATION_FAMILIES` list retains the previous selected-section mode. Run `teq cms:generate` to generate discovery files. See the [publication guide](docs/publications.md) for host policy, main-page behavior, source validation, migration, and the optional private agent inbox.

## Agent-Driven Development

TeqFW is built through the same development model that it is designed to enable: one human defines the intent, architecture, constraints, and acceptance criteria; coding agents implement and maintain the products; other agents use those products in different combinations to create applications.

`@flancer32/teq-cms` is built on TeqFW and uses its packages as agent-readable application components. The package includes a version-matched Agent Skill in `skills/teqfw-cms`. The README provides a human-facing product overview; the skill provides agents with the package concepts, contracts, integration rules, examples, and boundaries.

Mount the skill into a host project:

```sh
mkdir -p .agents/skills
ln -s ../../node_modules/@flancer32/teq-cms/skills/teqfw-cms \
  .agents/skills/teqfw-cms
```

Each TeqFW package is both a practical software component and a working demonstration of human-governed, agent-driven development. This work follows the Agent-Driven Software Management (ADSM) approach: human intent, architectural authority, acceptance, and responsibility remain authoritative; agents act as implementation and reasoning partners.

- [Tequila Framework](https://teqfw.com/?from=github-@flancer32/teq-cms)
- [Agent-Driven Software Management: A Practical Guide](http://fly.wiredgeese.com/flancer/leanpub/adsm-en/?from=github-@flancer32/teq-cms)
- [Alex Gusev](https://github.com/flancer64)

## License

Apache-2.0 © Alex Gusev — [https://github.com/flancer64](https://github.com/flancer64)
