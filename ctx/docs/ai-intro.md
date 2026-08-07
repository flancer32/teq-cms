# AI Introduction

## Project Type

TeqCMS is a Node.js ESM package and CLI for a minimalist file-based multilingual CMS.

## Problem Space

The package renders localized website templates and synchronizes translations through an OpenAI-compatible API while keeping content in files and Git.

## Product Role

TeqCMS is a TeqFW plugin and application host integration. It composes TeqFW DI, template, web, logging, configuration, and CLI packages.

## Primary Audience

The primary audience is developers who integrate the CMS into Node.js websites and agents who maintain the package.

## Technology Base

- Node.js 20 or newer.
- Native ESM JavaScript with JSDoc.
- npm package delivery without a build step.
- TeqFW dependency injection and namespace-based composition.

## Distinguishing Characteristics

- Content and translation state are file-based.
- The CLI is the composition root.
- Runtime recovery after the dependency migration is intentionally a separate phase.

## What This Project Is Not

- It is not a database-backed CMS.
- It is not a browser SPA.
- It uses the DI 2 generation of the TeqFW platform packages.

## Reading Angle

Read `product/overview.md`, then `architecture/overview.md`, `environment/dependencies.md`, and `code/verification.md`.
