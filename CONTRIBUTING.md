# Contributing to eslint-plugin-faf

Welcome to the `eslint-plugin-faf` contributor guide. This document outlines the architectural structure, coding conventions, testing strategies, quality gates, and workflow required for contributing to the repository.

---

## 1. Purpose

`eslint-plugin-faf` is an ESLint plugin that verifies codebase conformity to the **Fractal Architecture Framework (FAF)**.

- It exposes a single ESLint rule: `faf/conformity`, configured as `error` in `configs.recommended` with zero configuration options.
- The authoritative specification of FAF is available at [https://github.com/morriconeluca/fractal-architecture-framework](https://github.com/morriconeluca/fractal-architecture-framework).

---

## 2. Repository Architecture

The repository is structured strictly according to FAF principles.

### 2.1 Scaffold: Root Fragment and Public Surface

- **Origin `src/` is a Root Fragment, not a Root Layer**: The entry point of the package serves as a boundary with external tooling (Node.js and ESLint resolve the entry points defined in `package.json#exports`) and must expose heterogeneous Symbols: the plugin object (`default`) alongside public configuration types. In FAF, only a Root Node may declare multiple Symbols and re-export heterogeneous declarations. If `src/` were a Root Layer, its entry point would have to be an `index.ts` Access Node of a Fragment, which may only re-export the Symbols of its own Fragment Nodes.
- **Single Root Node: `src/main.ts`**: `src/main.ts` is the sole Root Node of the repository and the only element in the Public Surface (`publicRootNodes: ['src/main.ts']`). It composes the plugin object, configures `configs.recommended`, and re-exports public types (`TFAFConfig` and associated types). There is no CLI and no programmatic API; ESLint natively provides execution runners, Node.js APIs, formatters, and process exit codes.
- **No nested Root Fragments and no Private Categories in `src/`**: Sibling Private Categories cannot depend on one another or be ordered, which would prevent a staged pipeline.
- **Single outgoing external dependency**: `src/main.ts` reads the package version from `package.json` via an authorized outgoing edge declared in `externalDependencies`.

### 2.2 Fractal Branch and Layers

All internal implementation lives inside the Fractal Branch `src/_src@shared/`, partitioned into seven Layers ordered by a local Horizontal Hierarchy:

```text
src/                     Root Fragment
  main.ts                Root Node, Public Surface
  _src@shared/           Fractal Branch
    _domain/             R0 — Public config types, outcome model, invariants, POSIX path helpers
    _declarations/       R1 — Configuration validation, normalization, effective catalog composition, aliases
    _syntax/             R1 — Module Records from source: oxc parser, CSS scanner
    _inventory/          R2 — File/directory inventory, item IDs, preorder intervals, LCA, tree containment
    _taxonomy/           R3 — Role from file name, relational classification, hierarchies, structural norms
    _graph/              R4 — Dependency graph, edge norms, Symbol norms, global norms (SCC condensation)
    _runtime/            R5 — Imperative shell: file system, fafconfig.ts loading, resolver, cache, session, verifyProject, rule
```

#### Pure Layers (R0–R4) vs Imperative Shell (R5)

- **Pure Layers (`_domain`, `_declarations`, `_syntax`, `_inventory`, `_taxonomy`, `_graph`)**: Layers R0 through R4 are strictly functional and side-effect free. They perform no file system I/O, access no environment or process variables, invoke no dynamic loaders, and call no side-effecting libraries. They accept data structures and return data structures. Their `_mocks` categories contain purely in-memory fixtures.
- **Imperative Shell (`_runtime`)**: R5 is the sole layer permitted to execute effects. It handles file system reading via synchronous `node:fs`, worker-based synchronous configuration loading, module resolution via `oxc-resolver`, caching, session memoization, coordination in `verifyProject`, and the `faf/conformity` ESLint rule.
- **Downward dependency enforcement**: Because Horizontal Hierarchies forbid upward dependencies toward higher Ranks, pure layers can never import from `_runtime`. Architectural purity is structurally enforced.
- **Layers of the same Rank**: Layers sharing the same Rank (such as `_declarations` and `_syntax` at R1) cannot import each other; both depend exclusively on `_domain`.
- **Synchronous pipeline**: ESLint runs rule listeners synchronously and discards deferred `context.report()` calls. The entire verification pipeline is synchronous; no `async` functions or `Promise` primitives exist in `_runtime`. Disk operations use synchronous `node:fs`, `parseSync` from `oxc-parser`, and synchronous `oxc-resolver`. Configuration loading executes in a dedicated worker thread waited synchronously via `Atomics.wait`.

### 2.3 Role Catalog

The repository defines the following catalog of Roles:

| Rank | Role                | Category     | Form                             | Responsibility                                                                               |
| ---- | ------------------- | ------------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| 0    | `constant`          | `_constants` | Category Nodes, multiple Symbols | Primitive literal values with no dependencies.                                               |
| 1    | `type`              | `_types`     | Category Nodes, multiple Symbols | Static type definitions; mandatory JSDoc.                                                    |
| 2    | `mock`              | `_mocks`     | Category Nodes, multiple Symbols | In-memory synthetic fixtures and sample data.                                                |
| 3    | `config`            | `_configs`   | Category Nodes, multiple Symbols | Typed immutable domain values (containment matrix, message catalogs).                        |
| 4    | `util`              | `_utils`     | Fragments                        | Pure functional processing functions.                                                        |
| 5    | `norm`              | `_norms`     | Fragments                        | Verification of a FAF norm: `(model) → outcomes`.                                            |
| 6    | `adapter`           | `_adapters`  | Fragments                        | Side effects (file system, config loader, resolver, cache); converts exceptions to outcomes. |
| 7    | `service`           | `_services`  | Fragments                        | Pipeline coordination (`verifyProject`).                                                     |
| 8    | `store`             | `_stores`    | Fragments                        | Process state encapsulated in module closures (session).                                     |
| 9    | `rule`              | `_rules`     | Fragments                        | ESLint rule definition object (`faf/conformity`).                                            |
| 10   | Access Node, `spec` | —            | —                                | Top Rank.                                                                                    |

Sub-Graph Role: `spec` designates unit test entry points.

#### Rationales for Specific Roles

- **`norm`**: FAF architectural norms represent the core domain concept of the plugin. Because FAF constraints are conjunctive and cannot override or suppress each other, norms must remain mutually independent. As sibling Fragments within `_norms/`, two norms cannot import each other, rendering independence mechanically verifiable. The name distinguishes FAF specification norms from configuration format validation, which are pure `util` validators.
- **`adapter`**: In the FAF reference model, `util` denotes pure processing. Implementing side effects inside `util` would compromise Role/Symbol coherence. Adapters exist exclusively within `_runtime`.
- **`service`**: `verifyProject` coordinates adapters and pure stages. It is neither pure functional processing (`util`) nor an elementary effect (`adapter`), but a pipeline coordinator.
- **`rule`**: The export is an ESLint `{ meta, create }` module governed by ESLint's plugin contract, distinct from pure functions and static configurations.

Roles such as `class` and `error` are omitted in accordance with the functional paradigm.

### 2.4 Layout within Layers and Norm Naming

- **Category Hierarchy**: Each Layer organizes its units under a consistent Category hierarchy:
  `[['_constants'], ['_types'], ['_mocks'], ['_configs'], ['_utils'], ['_norms'], ['_adapters'], ['_services'], ['_stores'], ['_rules']]`.
  Layers only introduce the Categories they need (`_norms` is present only in `_taxonomy` and `_graph`; `_adapters`, `_services`, `_stores`, and `_rules` are present only in `_runtime`).
- **Function Composition Rules**:
  - Sibling Fragments in the same Category cannot import each other.
  - A private helper dedicated to a single Fragment resides in that Fragment's Private Category (`<fragment>/_utils/<helper>/`).
  - A helper shared across multiple units within the same Layer resides in the Layer's Fractal Branch (`_<layer>@shared/_utils/`).
  - A helper consumed by higher Layers resides in the `_utils` Category of the lowest Layer that requires it.
- **Norm Naming Convention**: Each Fragment under `_norms/` bears the exact English designation of the FAF specification clause it enforces:
  - In `_taxonomy/_norms/`: `classification-completeness`, `containment-matrix`, `exclusive-forms`, `fragment-anatomy`, `category-role`, `nomenclature`, `horizontal-hierarchies`, `public-surface`.
  - In `_graph/_norms/`: `peer-separation`, `fragment-encapsulation`, `private-category-visibility`, `fractal-branch-visibility`, `root-node-discipline`, `sub-graph-node-isolation`, `foreign-node-isolation`, `access-node-contract`, `tree-frontier`, `external-dependencies`, `path-alias-anchoring`, `symbol-uniqueness`, `re-export-prohibition`, `acyclicity`, `fractal-branch-unidirectionality`, `re-entry-prohibition`.
    Any helper needed by an individual norm resides in its own Private Category.

### 2.5 Fragment Anatomy

Every Fragment consists of:

- **Master Node (`<name>.<role>.ts`)**: The sole Fragment Node bearing the Fragment's Role. It defines and exports exactly one Symbol embodying the Fragment's architectural responsibility.
- **Access Node (`index.ts`)**: The mandatory public boundary of the Fragment. It re-exports the Symbol of the Master Node (and optionally Symbols from other internal Fragment Nodes) and defines no Symbols of its own.
- **Sub-Graph Node (`<name>.spec.ts`)**: Sibling unit test entry point carrying the Sub-Graph Role `spec`.

### 2.6 Code Outside the Tree

Code residing outside the Fractal Tree (`src/`):

- `test/`: Acceptance tests, type tests, and tooling tests.
- `bench/`: End-to-end benchmark suites.
- `scripts/`: Tooling and gate enforcement scripts.
- Tooling configuration files (`eslint.config.ts`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `stryker.config.json`).
- `fafconfig.ts`: Repository architectural configuration.

All code outside the Tree may import exclusively `src/main.ts` from `src/`. Direct imports into `src/_src@shared/` from outside the Tree are prohibited.

---

## 3. Coding Conventions

All code must strictly adhere to the following conventions:

### 3.1 Language

- All identifiers, file and directory names, diagnostic messages, `meta.docs`, JSDoc comments, test descriptions, documentation, changeset entries, and commit messages must be written in **English**.
- FAF domain terminology must retain exact specification terms (`Fragment`, `Access Node`, `Fractal Branch`, `Root Node`, `Logical Node`, `Foreign Node`, etc.).

### 3.2 Types

- **Type aliases only**: Use `type` aliases for all types declared in the codebase. The `interface` keyword is strictly forbidden.
- **Prefix `T`**: Every declared type alias name must begin with an uppercase `T` (e.g., `TOutcome`, `TRole`).
- **External dependency types**: Types imported from external libraries (`Rule`, `ESLint.Plugin`, AST types from `oxc-parser`) retain their original names without import renaming or synthetic `T` prefixes. Extensions are composed via type intersection into a newly declared `type` prefixed with `T`.

### 3.3 Comments Policy

- Comments are forbidden across the codebase, with one single exception: JSDoc blocks (`/** ... */`) in `*.type.ts` files.
- In `*.type.ts` files, JSDoc blocks are **mandatory** on every `type` alias and on every property signature.
- Prohibited everywhere else: inline comments (`//`), block comments (`/* ... */`), JSDoc outside `*.type.ts`, ESLint disable directives (`eslint-disable`, `eslint-disable-next-line`), TypeScript directives (`@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`), triple-slash references (`/// <reference>`), and shebangs.

### 3.4 Functional Paradigm and Immutability

- **Functional composition over inheritance**: No `class` declarations, no `this`, and no `extends`. The use of external dependency classes (such as `oxc-resolver`) is confined strictly to `_runtime/_adapters/`.
- **Expected failures are data**: No exceptions for expected failures. Errors are returned as typed outcome data (`TOutcome`, discriminated unions).
- **No `throw` statements**: The `throw` keyword is forbidden throughout the repository, with a single authorized exception: the `assertInvariant(condition, message): asserts condition` function in `_domain/_utils/assert-invariant/`. Invariant assertions throw a plain `Error` to immediately halt execution when an internal defect or broken assumption occurs.
- **External exception handling**: Exceptions thrown by Node.js or third-party libraries (`fs`, `import()`, `JSON.parse`) are caught inside adapters and translated into structured outcome records.
- **Boundary immutability**: All interface and type contracts use `readonly` modifiers on properties and collections. Function arguments must not be mutated.
- **Local mutation**: Local mutation is permitted exclusively on temporary data structures allocated and kept private within the executing function (e.g., Tarjan's SCC algorithm or CSR adjacency construction in `Int32Array`) to meet performance budgets.
- **Side effects**: Side effects are strictly confined to `_runtime/_adapters/`.
- **Shared state**: Process state is strictly confined to `_runtime/_stores/` and encapsulated within module closures.

### 3.5 Automated Rule Enforcement

Conventions are mechanically validated by ESLint and TypeScript compiler checks:

- `repository/comment-policy`: Enforces the comment policy, flagging any comment, directive, or shebang outside `*.type.ts` JSDoc blocks.
- `jsdoc/*`: Enforces informative JSDoc documentation, absence of redundant type annotations, and valid tags (`@default`, `@example`) in `*.type.ts`.
- `@typescript-eslint/consistent-type-definitions: ['error', 'type']`: Prohibits `interface`.
- `@typescript-eslint/naming-convention`: Enforces `PascalCase` with `T` prefix on type aliases.
- `@typescript-eslint/consistent-type-assertions: ['error', { assertionStyle: 'never' }]`: Disallows `as` casts, permitting only `as const`.
- `@typescript-eslint/strict-boolean-expressions` and `@typescript-eslint/switch-exhaustiveness-check`: Ensure rigorous boolean handling and exhaustive pattern matching.
- `no-restricted-syntax`: Prohibits `ClassDeclaration`, `ClassExpression`, `ThisExpression`, and `ThrowStatement` (with the exception of `assert-invariant`).

---

## 4. Testing

### 4.1 Test Placement

- **Unit tests**: Every Fragment must include a sibling test file `<name>.spec.ts` located in the same directory as the Master Node `<name>.<role>.ts`.
- **External tests**: Acceptance tests, type assertions, and tooling verification reside in `test/` outside the Fractal Tree and interact exclusively with `src/main.ts`.

### 4.2 In-Memory Fixtures for Pure Layers

- Unit tests for pure layers (`_domain`, `_declarations`, `_syntax`, `_inventory`, `_taxonomy`, `_graph`) use exclusively in-memory data structures. They do not touch the disk or spawn child processes.

### 4.3 Disk Fixtures with `fs-fixture`

- Tests for adapters, services, rules, and acceptance test suites interact with real file system structures created in temporary directories using `fs-fixture`.
- Virtual or simulated file systems (such as `mock-fs` or `memfs`) are strictly prohibited because `oxc-resolver` relies on native file system calls and actual disk paths.
- Fixture creation logic relies directly on `fs-fixture` without duplicated custom fixture generator utilities.

---

## 5. Quality Gates

The codebase enforces five sequential quality gates. All gates must pass in local verification and CI pipelines:

1. **`gate:1`** (`npm run gate:1`):
   - Formatter: Runs Prettier check across the workspace (`prettier --check`).
   - Type check: Runs TypeScript compiler without emit (`tsc --noEmit`).
2. **`gate:2`** (`npm run gate:2`):
   - Linting: Runs ESLint with type-checked rules, comment policy, SonarJS, Unicorn, Perfectionist, and import rules.
3. **`gate:3`** (`npm run gate:3`):
   - Testing & Coverage: Runs Vitest test suite with v8 coverage analysis.
   - Strict per-file thresholds: **≥ 95% line coverage** and **≥ 90% branch coverage**.
4. **`gate:4`** (`npm run gate:4`):
   - Mutation Testing: Runs Stryker Mutator followed by per-file threshold evaluation (`scripts/check-mutation-threshold.ts`).
   - Strict per-file threshold: **≥ 85% mutation score**.
5. **`gate:5`** (`npm run gate:5`):
   - Packaging & Types: Bundles the package with `tsup`, executes package export validation via `publint --strict`, and validates TypeScript declaration exports via `@arethetypeswrong/cli` (`attw -q --pack .`).

### The Binding Principle

No quality gate constraint may be weakened or bypassed. All five gates (`npm run gate:all`) must pass green prior to integration.

---

## 6. Workflow

### 6.1 Common Commands

- **Run all quality gates**:
  ```bash
  npm run gate:all
  ```
- **Run fast check (format + type check + lint)**:
  ```bash
  npm run gate:fast
  ```
- **Run unit tests in watch mode**:
  ```bash
  npm run dev
  ```
- **Auto-fix formatting and linting**:
  ```bash
  npm run sanitize
  ```
- **Build release bundle**:
  ```bash
  npm run build
  ```

### 6.2 Commit Conventions

- Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Format: `<type>(<scope>): <description>` (e.g., `feat(taxonomy): add category-role norm`).
- Commit messages are validated automatically via `@commitlint/cli` and Husky git hooks.

### 6.3 Changesets

- Any user-facing or architectural change must be documented via Changesets:
  ```bash
  npx changeset
  ```
- Follow the prompt to specify the release bump type (`major`, `minor`, `patch`) and write a concise change summary in English.
