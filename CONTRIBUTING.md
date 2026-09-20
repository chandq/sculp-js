# Contributing to sculp-js

Thank you for helping improve sculp-js. Contributions of code, tests, documentation, issue reports, and design feedback are welcome.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Please report security vulnerabilities according to the [Security Policy](./SECURITY.md), not through a public issue.

## Before You Start

- Search [existing issues](https://github.com/chandq/sculp-js/issues) and pull requests before opening a new one.
- For a bug, include the sculp-js version, runtime and browser or Node.js version, expected behavior, actual behavior, and a minimal reproduction.
- For a significant feature, API change, breaking change, or new runtime dependency, open an issue first so the design and scope can be discussed.
- Keep each issue and pull request focused on one logical change.

## Development Setup

The repository uses npm and commits `package-lock.json`. Node.js 22 is the recommended local version and is recorded in `.nvmrc`.

```bash
git clone https://github.com/chandq/sculp-js.git
cd sculp-js
nvm use
npm ci
```

If Node Version Manager is not installed, use a compatible Node.js release supported by the CI matrix. Do not replace the npm lockfile with a lockfile from another package manager.

## Repository Layout

- `src/`: TypeScript source modules and public entry points
- `test/`: Jest tests, generally named after the corresponding source module
- `docs-site/`: VitePress documentation source
- `scripts/`: build and documentation automation
- `api-docs/` and `docs-site/api/`: generated API documentation; do not edit generated pages by hand
- `dist/`, `coverage/`, and `temp/`: generated local output; do not commit these directories

## Making a Change

1. Create a branch from the latest `main` branch.
2. Make the smallest coherent change that solves the problem.
3. Preserve the zero-runtime-dependency design unless a dependency has been discussed and approved.
4. Add or update tests for observable behavior, bug fixes, edge cases, and public API changes.
5. Update JSDoc, README examples, or documentation when behavior or public APIs change.
6. If you add a public module or export, update all relevant entry points, subpath exports, and type mappings.
7. Run the appropriate checks before opening a pull request.

Follow the existing TypeScript style: strict typing, two-space indentation, single quotes, semicolons, and no trailing commas. Avoid unrelated refactors or generated-file churn.

## Validation

Run the checks relevant to your change. For source changes, the expected full validation is:

```bash
npm run lint
npm test
npm run build
```

Useful commands:

| Command                            | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `npm run test:unit -- <test-file>` | Run a focused Jest test file                            |
| `npm test`                         | Run the full test suite with coverage thresholds        |
| `npm run lint`                     | Check source files with ESLint and Prettier integration |
| `npm run lint:fix`                 | Fix supported lint issues in source files               |
| `npm run build`                    | Build ESM, CJS, UMD, and type declarations              |
| `npm run docs-site:build`          | Regenerate and build docs after `npm run build`         |

API documentation generation reads the declarations in `dist/types`, so run `npm run build` first. Documentation generation rewrites generated API files; include those changes only when they are intentional and required by the contribution.

## Commit Messages

Commit messages are checked with Commitlint and should follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <short description>
```

Common types include `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style`, `types`, and `revert`.

Examples:

```text
feat(tree): support custom child fields
fix(date): preserve zero millisecond values
docs: clarify subpath imports
```

Use `!` or a `BREAKING CHANGE:` footer for an intentional incompatible change, and explain the migration path in the pull request.

## Pull Requests

- Target the `main` branch and complete the pull request template.
- Link related issues with keywords such as `Closes #123` when appropriate.
- Explain the motivation and user-visible behavior, not only the implementation.
- Describe how the change was tested and disclose checks that were not run.
- Add screenshots or short recordings for documentation or browser-visible changes when useful.
- Keep generated files, dependency updates, and formatting changes limited to the scope of the pull request.
- Respond to review feedback constructively. Maintainers may request changes, split an oversized pull request, or decline changes that do not fit the project direction.

All required CI checks must pass before merge. Maintainers handle version bumps, changelog generation, releases, and npm publication; contributors should not manually change the package version or release notes unless requested.

## Licensing

By submitting a contribution, you agree that it may be distributed under the project's [MIT License](./LICENSE).
