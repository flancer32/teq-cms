# JSConfig Environment Rules

## Location and Coverage

`jsconfig.json` exists at the project root and covers every `.js`, `.mjs`, and `.d.ts` file needed by the runtime and declaration surface.

## Compiler Baseline

The configuration includes:

- `checkJs: true`;
- `module: es2022`;
- `target: es2022`;
- `moduleResolution: node`;
- `strict: true`;
- `allowSyntheticDefaultImports: true`.

## Module Compatibility

The configuration remains compatible with `package.json`'s `type: module` field and the prohibition on `exports`.
Only Node-style ESM resolution is allowed.

## Typing Constraints

Typing comes from JSDoc annotations and `.d.ts` files.
No TypeScript sources, emitters, or loader plugins are configured.
