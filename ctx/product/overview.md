# TeqCMS — Product Overview

Path: `ctx/product/overview.md`

## Purpose

TeqCMS is a minimalist file-based CMS for multilingual websites.
Content is stored as code, uses Git and templates, and ensures a transparent, reproducible development workflow.
The system is built on a strict file structure and automation, without control panels or databases.

---

## Architecture

### Templates

Pages are HTML files located in `tmpl/` and rendered by the server through the chosen templating engine.
The CMS adapter extracts the locale, resolves the path, prepares data, and selects the appropriate template.

### Request Processing

The system analyzes the URL, locale, and metadata, then returns a fully rendered page.
Configuration defines locales, routing paths, server settings, and model API parameters.

---

## Automatic Translation

TeqCMS automatically synchronizes localized versions of pages:

- tracks changes in the base locale,
- constructs an LLM request,
- receives the translated template in the required format,
- saves the result and updates metadata.

Translation state is stored in a JSON file that remains synchronized with the file system.
No manual duplication or divergence between language versions.

---

## Features

- Fully file-based content: storage, version control, deployment.
- Server-side rendering with no headless layer.
- Automatic multilingual support powered by LLM.
- Easy integration into any Node.js project.
- Transparent and reproducible technical workflow.

---

## Use Cases

TeqCMS is suitable for:

- websites and landing pages,
- documentation and developer portals,
- projects with strict requirements for structure, version control, and multilingual content.
