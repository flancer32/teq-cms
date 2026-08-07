# NPM Publish Rules

## Package Contents

The published tarball is controlled by the `files` allowlist in `package.json`.
It includes runtime sources, templates, web assets, the package-owned
consumer skill under `skills/`, declaration files, and selected package
documentation.

Development-only directories and generated artifacts are excluded, including `test/`, `doc/`, `ctx/`, caches, and build output.

## Build Constraints

The package is publishable without a build step.
No bundling, transpilation, code generation, or external compilation tooling is required before publishing.

## Versioning

Semantic versioning is maintained.
Changes to the npm payload or observable CLI behavior require corresponding version review.

## Verification

The package payload is checked with `npm pack --dry-run`.
