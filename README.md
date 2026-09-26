# @flancer32/teq-cms

![npms.io](https://img.shields.io/npm/dm/@flancer32/teq-cms)

> **Human-governed. Agent-built. Agent-ready.**

`@flancer32/teq-cms` builds multilingual websites from version-controlled files. Agents author Markdown for each locale; the CMS renders HTML for people and can expose selected Markdown to agents. It is built on the Tequila Framework ([TeqFW](https://teqfw.com/)) and ships with a version-matched Agent Skill.

## Why use it

TeqCMS keeps pages and templates in the project filesystem and Git. It needs no database or admin panel, so content remains transparent, reviewable, and reproducible.

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

Hosts can opt a route family into localized Markdown-backed HTML pages and explicitly select locales whose Markdown sources are public. Run `teq cms:generate` to create `robots.txt`, `llms.txt`, and `sitemap.xml` from configured publications. An optional `GET /agent/message` handler accepts agent messages into a private file inbox. See the [Markdown publication guide](docs/publications.md).

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
