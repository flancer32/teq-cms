# @flancer32/teq-cms

A CMS plugin for the Tequila Framework (TeqFW).  
Provides server-side rendering of multilingual Mustache templates stored as files.  
Intended for building content-oriented websites and pages with dynamic localization.

## Features

- Renders pages using [Mustache](https://mustache.github.io/) templates
- Supports multilingual content via locale-aware file resolution
- Integrates with `@flancer32/teq-web` and `@flancer32/teq-tmpl` plugins
- Lightweight and file-based — no database required

## Usage

Install as a plugin in a TeqFW-based application.  
Pages are rendered on request using locale-specific templates from the server filesystem.

## Requirements

- Node.js >= 22
- Tequila Framework (`teqfw`)
- Plugins: `@flancer32/teq-web`, `@flancer32/teq-tmpl`

## License

Apache-2.0 © Alex Gusev
