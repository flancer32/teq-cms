# AI Introduction

- Path: `ctx/docs/ai-intro.md`
- Changed: `20260930`

## Project Type

TeqCMS is a Node.js ESM package and CLI for a multilingual CMS built around agents and Markdown.

## Problem Space

Agents read, create, maintain, and translate Markdown content directly in Git. Locale variants are explicit Markdown files. TeqCMS publishes raw Markdown for agents and derives localized HTML projections for people.

## Product Role

TeqCMS is a TeqFW plugin and application host integration. It composes TeqFW DI, template, web, logging, configuration, and CLI packages.

## Primary Audience

The primary audience is agents building and maintaining websites, followed by developers and human readers.

## Technology Base

- Node.js 20 or newer.
- Native ESM JavaScript with JSDoc.
- npm package delivery without a build step.
- TeqFW dependency injection and namespace-based composition.

## Distinguishing Characteristics

- Markdown is the primary authored content; HTML pages are derived presentations. Source priority does not select the HTTP response format.
- Explicit `.md` or `.html` overrides headers. Extensionless publication URLs use `Accept`, then `User-Agent` hints: Markdown for agents, HTML for people, with HTML as the ambiguous-client default. See `architecture/publication.md`.
- Translations are version-controlled locale-specific Markdown files maintained by agents; TeqCMS has no LLM API translation service or translation state.
- The CLI is the composition root.
- A finite CLI command generates discovery files; an optional web handler saves agent messages for the owner.

## What This Project Is Not

- It is not a database-backed CMS.
- It is not a browser SPA.
- It uses the DI 2 generation of the TeqFW platform packages.

## Reading Angle

Read `product/overview.md`, then `architecture/overview.md`, `environment/dependencies.md`, and `code/verification.md`.
