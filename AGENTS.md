# Repository Instructions for Coding Agents

These instructions apply to the entire repository. Human contributor guidance is in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project Overview

sculp-js is a zero-runtime-dependency TypeScript utility library. It publishes ESM, CommonJS, UMD, type declarations, and module-specific subpath exports. Changes should preserve public API compatibility, tree-shaking, and browser and Node.js behavior unless the task explicitly requires otherwise.

## Source of Truth

- Edit implementation in `src/` and tests in `test/`.
- Treat `dist/`, `coverage/`, `temp/`, `api-docs/markdown/`, and `docs-site/api/` as generated output.
- Do not edit generated API pages to change API documentation. Update source JSDoc, run `npm run build`, then use `npm run docs:gen-api` and `npm run docs:sync` when regeneration is required.
- Do not change package versions, tags, `CHANGELOG.md`, or release artifacts unless the task explicitly concerns a release.

## Implementation Rules

- Keep changes narrow and preserve unrelated work in the working tree.
- Follow existing TypeScript and Prettier conventions: strict types, two-space indentation, single quotes, semicolons, and no trailing commas.
- Avoid `any` where a precise type is practical. Preserve the public types of existing APIs unless a breaking change is explicitly requested.
- Preserve the zero-runtime-dependency policy. Do not add or upgrade dependencies without a clear task requirement.
- Add a test in the matching `test/*.test.ts` file for behavior changes and regressions.
- For a new public utility, update the relevant source module, `src/index.ts`, `src/core-index.ts` when environment-neutral, and the `exports` and `typesVersions` mappings in `package.json` when adding a new subpath.
- Keep browser-only APIs guarded so importing the package remains safe in non-browser environments.
- Do not commit local artifacts such as `.DS_Store`, build output, coverage data, caches, or editor settings.

## Validation

Use Node.js 22 from `.nvmrc` and install dependencies with `npm ci` when a clean install is needed.

Run the smallest relevant check while iterating, then validate source changes with:

```bash
npm run lint
npm test
npm run build
```

For documentation-site changes, also run:

```bash
npm run build
npm run docs-site:build
```

If a check cannot be run, state exactly which check was skipped and why. Do not claim success based only on inspection.

## Git and Pull Requests

- Follow Conventional Commits, for example `fix(tree): handle empty child arrays`.
- Do not rewrite, discard, or include unrelated user changes.
- Do not amend commits, force-push, publish packages, or create releases unless explicitly requested.
- In pull request descriptions, explain the problem, the solution, compatibility impact, and verification performed.

## Definition of Done

A change is complete when implementation, tests, public types and exports, and user-facing documentation agree; relevant checks pass; and the diff contains no unrelated or generated-file noise.
