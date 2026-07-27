# eslint-plugin-faf

## 0.1.1

### Patch Changes

- 2af8fc0: Refactor package entrypoint by decomposing `src/main.ts` into single-responsibility Root Nodes (`types.ts`, `rules.ts`, `configs.ts`, `main.ts`).
- 0ea809b: Refactor context utilities into individual fragments under systemic design directories, add strict nesting validation rules to `faf/naming-conventions`, and optimize linter caches.

## 0.1.0

### Minor Changes

- 91247b5: Initial release of the `eslint-plugin-faf` plugin, designed to enforce the Fractal Architecture Framework (FAF) guidelines:

  - Introduced the core FAF engine with high-performance caches (`dirCache`, `classifyCache`, `rolesCache`) for fast static analysis.
  - Introduced 7 rules to enforce FAF constraints:
    - `naming-conventions`: Enforces kebab-case folder structure, role suffix naming, and FAF taxonomy.
    - `enforce-access-node`: Restricts the barrel `index.ts` to export only its sibling Fragment Nodes.
    - `no-direct-fragment-import`: Prevents direct imports of Fragment internal files from the outside.
    - `no-private-category-leak`: Restricts access to Private Categories (e.g., nested `_components`).
    - `no-fractal-branch-leak`: Restricts access to Fractal Branches (e.g., `_src@shared`).
    - `no-peer-dependency`: Enforces sibling separation and horizontal/role import hierarchies.
    - `category-mutually-exclusive`: Enforces category purity (only Fragments or only Logical Nodes).
  - Fully compatible with modern ESLint flat configurations (v9 and v10) using `configs.recommended`.
  - Supports single-source-of-truth path aliases via `package.json` `"imports"`, with fallback to `faf.config.ts`.
