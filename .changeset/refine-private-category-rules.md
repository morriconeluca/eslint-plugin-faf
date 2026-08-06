---
'@morriconeluca/eslint-plugin-faf': minor
---

Refactored private category checks, added local domain utility helpers, and refined rule checks to improve rule precision.

- **category-mutually-exclusive**: Skip reporting direct file node errors if the extension is disallowed, delegating the precise error to `naming-conventions`.
- **no-fractal-branch-leak** & **no-private-category-leak**: Refine Private Category Leak checking to allow imports from within the same sub-domain under a private category or within authorized nested fractal branches.
- **CI/CD**: Added a GitHub action release workflow using changesets.
