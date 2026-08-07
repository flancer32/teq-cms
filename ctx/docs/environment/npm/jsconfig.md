# JSConfig Environment Rules

## Location and Coverage

`jsconfig.json` exists at the project root and covers the runtime, the package
type map, and the dependency type maps required by TeqFW ambient aliases.

## Compiler Baseline

The configuration includes:

- `checkJs: true`;
- `forceConsistentCasingInFileNames: true`;
- `maxNodeModuleJsDepth: 0`;
- `module: nodenext`;
- `moduleResolution: nodenext`;
- `noEmit: true`;
- `skipLibCheck: true`;
- `strict: true`;
- `target: ESNext`;
- `types: ["node"]`.

## Module Compatibility

The configuration remains compatible with `package.json`'s `type: module` field and the prohibition on `exports`.
Only Node-style ESM resolution is allowed. The program explicitly includes
the installed TeqFW and Flancer32 dependency `types.d.ts` paths so ambient
namespace aliases resolve to their public JSDoc contracts. Dependency source
trees are not part of this package's type-check target.

## Typing Constraints

Typing comes from JSDoc annotations and `.d.ts` files.
No TypeScript sources, emitters, or loader plugins are configured. Static
checking is run with:

```text
npm run typecheck
```
