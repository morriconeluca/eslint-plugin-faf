# Contributing to eslint-plugin-faf

Thank you for your interest in contributing to `@morriconeluca/eslint-plugin-faf`.

## Scope

This repository implements static verification for the [Fractal Architecture Framework (FAF) specification](https://github.com/morriconeluca/fractal-architecture-framework/blob/main/FAF.md):

- **Specification changes**: Proposals to add, remove, or modify FAF architectural rules belong in the [specification repository](https://github.com/morriconeluca/fractal-architecture-framework), not here.
- **Language**: Code, tests, documentation, issues, commit messages, and pull requests must be written in English.

## Ways to Contribute

- **Editorial fixes**: Typos, broken links, or documentation clarifications can be submitted directly as a pull request.
- **Bug reports**: Search existing issues first, then open an issue with:
  1. Node.js, ESLint, and `@morriconeluca/eslint-plugin-faf` versions.
  2. A minimal `faf.config.ts`, directory tree, and import snippet reproducing the problem.
  3. Observed vs. expected diagnostic outcome, citing the relevant `FAF.md` section when applicable.
- **Enhancements**: For performance improvements, resolution or loader edge cases, diagnostics, or TypeScript types, open an issue to align on the approach before submitting a pull request.

## Submitting a Pull Request

1. **Fork and set up**: Fork the repository, clone your fork locally, create a branch from `main`, and install dependencies with `npm ci` (**Node.js `>= 24`** required).
2. **Keep changes focused**: Address one issue or concern per pull request and include regression or acceptance tests for any behavioral change.
3. **Record a changeset**: If your change affects published runtime behavior or types, run `npx changeset` and commit the generated file.
4. **Verify locally**: Format and lint with `npm run sanitize`, then run `npm run ci` and ensure the entire pipeline passes.
5. **Follow commit conventions**: Format commit messages according to [Conventional Commits](https://www.conventionalcommits.org/) (`<type>(<scope>): <description>`) and reference the related issue in your pull request description.

## Conduct

Discuss ideas, not people. Support arguments with minimal reproductions, concrete directory trees, or specification references.

## License

By contributing to this project, you agree that your contributions will be licensed under its [MIT License](./LICENSE).
