# AI Introduction

- Path: `ctx/docs/ai-intro.md`
- Changed: `20260926`

## Project Type

TeqCMS is a Node.js ESM package and CLI for a minimalist file-based multilingual CMS.

## Problem Space

Agents author localized Markdown files in Git. TeqCMS renders them as HTML for people and can expose selected Markdown to agents.

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

- Localized content is file-based and directly maintained by agents.
- The CLI is the composition root.
- A finite CLI command generates discovery files; an optional web handler saves agent messages for the owner.

## What This Project Is Not

- It is not a database-backed CMS.
- It is not a browser SPA.
- It uses the DI 2 generation of the TeqFW platform packages.

## Reading Angle

Read `product/overview.md`, then `architecture/overview.md`, `environment/dependencies.md`, and `code/verification.md`.
