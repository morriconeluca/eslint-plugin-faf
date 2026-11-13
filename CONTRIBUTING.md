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

### 2.1 First Level

`src/` is a Root Fragment. The important concepts are visible at the first level; implementation details sit under their only consumer.

```text
src/                              Root Fragment
  main.ts                         Root Node: plugin object and public type re-exports
  _configs/recommended.config.ts  Private Category: recommended files and rules
  _rules/conformity/              Private Category: the conformity rule; verification is its detail
  _src@shared/                    Fractal Branch: only what main.ts and the rule share
    _types/faf-config.type.ts     Public configuration contract
```

- **Origin `src/` is a Root Fragment, not a Root Layer**: The package entry is a boundary with Node.js and ESLint and must expose heterogeneous Symbols: the plugin object (`default`) and the public configuration types. Only a Root Node may declare multiple Symbols and re-export heterogeneous declarations.
- **Single Root Node: `src/main.ts`**: It is the only element of the Public Surface (`publicRootNodes: ['src/main.ts']`). It composes the plugin object, registers `rules.conformity`, exposes `configs.recommended`, and re-exports `TFAFConfig` and associated types. There is no CLI and no programmatic API.
- **Single outgoing external dependency**: `src/main.ts` statically imports `package.json` (`import packageJson from '../package.json' with { type: 'json' }`) and reads `name` and `version`. That edge is the authorized `externalDependencies` entry. No other file may import or `require` the package manifest.

### 2.2 Dependency Chain

Direct dependencies, from the outside inward:

```text
main.ts
  package.json → meta.name, meta.version, meta.namespace = 'faf'
  createConformity(version) → rules.conformity
  configs.recommended = recommended.config + plugins.faf
recommended.config.ts
  files = LINTABLE_EXTENSIONS from _src@shared/_constants/faf.constant.ts
create(context): Rule.RuleModule
  discoverConfig({ configFile: settings.faf?.configFile, workingDirectory: context.cwd })
  session.outcomesFor({ configPath, filename, packageVersion, sourceText, workingDirectory })
    verifyProject({ configPath, fileOverlays?, workingDirectory })
      prepareProject(configPath):
        loadConfig → validateConfigFormat → readPackageJson → acquirePathAliases
        → composeDeclarations → listEntries → buildInventory → includeExternalTargets
        → validateConfigReferences
      verifyProject pipeline:
        prepareProject → classifyTaxonomy → deriveHorizontalHierarchies
        → derivePublicSurface → collectModules → buildDependencyGraph
        → deriveExternalCrossings → _norms/* (23 mutually independent norms)
        → anchorOutcomes → collectExternalFiles
```

Verification stages do not import one another. `verifyProject` composes them in that order and stops on a blocking preparation failure (configuration or inventory defect). Preparation and taxonomy outcomes accumulate alongside module, graph, and norm outcomes. The 23 norm verifications are mutually independent and evaluated against the unified verification model. `anchorOutcomes` indexes every outcome by one absolute lintable file. The session memoizes that index per `fafconfig.ts`, invalidating it upon changes to watched files (`fafconfig.ts`, loaded configuration imports, `package.json`, external files), tree origins, or source overlays. It loads the persistent Module Record cache from `node_modules/.cache/eslint-plugin-faf` under the configuration directory, writes the records used by each verification, and clears the in-memory cache when the active configuration changes. The pipeline stays synchronous: ESLint discards deferred `context.report()` calls. Disk access uses synchronous `node:fs`, script parsing uses `parseSync`, and module resolution uses synchronous `oxc-resolver`. Loading `fafconfig.ts` runs in a worker thread waited on synchronously.

### 2.3 Placement Criterion

Place each unit from its production consumers only (actual imports, specs excluded). A spec never decides where production code lives.

1. A unit with one production consumer lives in that consumer's Private Category, in the Category of its own Role.
2. A unit with several production consumers lives in the Fractal Branch of their nearest common domain (`<domain>/_<domain>@shared/<Category>/`).
3. Promote a unit when a new production consumer appears. Do not place it in a higher domain to dodge a sibling import, and do not place it for a consumer that does not exist yet.
4. A unit with no production consumers is not part of the tree. A stage that `verify-project` will compose stays in that service's Private Category until the call exists.

Sibling Fragments in one Category do not import each other. When shared units in the same Category must depend on each other, order them with Systemic Design Sub-Categories inside that Category: `_primitives` (Rank 0) < `_compounds` (Rank 1) < `_aggregates` < `_systems` < `_ecosystems`. Do not lift them into a higher domain. The general Horizontal Hierarchy declares that order as `[['_primitives'], ['_compounds'], ['_aggregates'], ['_systems'], ['_ecosystems']]`. A Sub-Category propagates the Parent Category's Role and is not itself a catalog Category.

A helper used by one Fragment lives in that Fragment's Private Category. A helper used by several units of the same domain lives in that domain's Fractal Branch. From outside a Fragment, import exclusively its `index.ts`. Within the same Fragment, the Sub-Graph Node `<name>.spec.ts` (which shares the top Rank with `index.ts` according to `FAF.md` §6.1.3) directly imports its Fragment's Master Node `./<name>.<role>.js` (and any other Fragment Nodes of lower Rank within the Fragment), and imports `index.ts` for Sub-Fragments or other external units.

A spec tests only its own Fragment. It does not retest Sub-Fragments, which have their own spec. Inputs are data, `_mocks`, or legal imports of the Fragment. A case that truly composes several stages belongs to the spec of the composer (`verify-project`) or to `test/`, not to one stage's spec.

### 2.4 Role Catalog

The repository defines the following catalog of Roles:

| Rank | Role                | Category     | Form                             | Responsibility                                                                                                                          |
| ---- | ------------------- | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | `constant`          | `_constants` | Category Nodes, multiple Symbols | Primitive literal values with no dependencies.                                                                                          |
| 1    | `schema`            | `_schemas`   | Fragments                        | Declarative runtime validation schemas.                                                                                                 |
| 2    | `type`              | `_types`     | Category Nodes, multiple Symbols | Static type definitions; mandatory JSDoc.                                                                                               |
| 3    | `mock`              | `_mocks`     | Category Nodes, multiple Symbols | In-memory synthetic fixtures and sample data.                                                                                           |
| 4    | `config`            | `_configs`   | Category Nodes, multiple Symbols | Typed immutable domain values (containment matrix, message catalogs).                                                                   |
| 5    | `util`              | `_utils`     | Fragments                        | Pure functional processing, including validation and parsing functions that consume schemas to produce typed domain values or outcomes. |
| 6    | `norm`              | `_norms`     | Fragments                        | Verification of a FAF norm: `(model) → outcomes`.                                                                                       |
| 7    | `adapter`           | `_adapters`  | Fragments                        | Side effects (file system, config loader, resolver, cache); converts exceptions to outcomes.                                            |
| 8    | `service`           | `_services`  | Fragments                        | Pipeline coordination (`verifyProject`).                                                                                                |
| 9    | `store`             | `_stores`    | Fragments                        | Process state encapsulated in module closures (session).                                                                                |
| 10   | `rule`              | `_rules`     | Fragments                        | ESLint rule definition object (`faf/conformity`).                                                                                       |
| 11   | Access Node, `spec` | —            | —                                | Top Rank.                                                                                                                               |

Sub-Graph Role: `spec` designates unit test entry points.

#### Rationales for Specific Roles

- **`schema`**: In alignment with the FAF reference model (`FAF.md` §6.1.2 and §6.1.3), `schema` sits at Rank 1 immediately after `constant` (Rank 0) and before `type` (Rank 2), `mock` (Rank 3), `config` (Rank 4), and `util` (Rank 5). It is reserved strictly for declarative runtime validation schemas and never depends on `.type.ts`, `_types/`, `_configs/`, `_mocks/`, or external `_utils/`. Functions that execute `.safeParse(...)`, validate, or translate errors into domain types or outcomes belong to `util` (Rank 5).
- **`norm`**: FAF architectural norms represent the core domain concept of the plugin. Because FAF constraints are conjunctive and cannot override or suppress each other, norms must remain mutually independent. As sibling Fragments within `_norms/`, two norms cannot import each other, rendering independence mechanically verifiable. The name distinguishes FAF specification norms from configuration format validation, which is a `util` consuming declarative `schema` Fragments.
- **`adapter`**: In the FAF reference model, `util` denotes pure processing. Implementing side effects inside `util` would compromise Role/Symbol coherence. A helper that performs effects (`node:fs`, a worker, or the resolver) is an `adapter` even inside another adapter's Private Category (`<fragment>/_adapters/<helper>/<helper>.adapter.ts`). An adapter may accept `unknown` because the value arrives from an effect (`JSON.parse`, a worker, or the disk).
- **`service`**: `verifyProject` coordinates adapters and pure stages. It is neither pure functional processing (`util`) nor an elementary effect (`adapter`), but a pipeline coordinator.
- **`rule`**: The export is an ESLint `{ meta, create }` module governed by ESLint's plugin contract, distinct from pure functions and static configurations.

Roles such as `class` and `error` are omitted in accordance with the functional paradigm.

### 2.5 Purity by Role

Purity is enforced by Role, not by a separate imperative shell. On `src/**/*.ts` excluding specs:

- Only `*.adapter.ts` may import `node:fs`, `fs`, `node:worker_threads`, `worker_threads`, `node:child_process`, `child_process`, or `oxc-resolver`, and only an adapter may read `process`.
- Files whose Role is `util`, `schema`, `norm`, `config`, `constant`, `type`, or `mock` must not import through an `_adapters` Category. Pure units do not depend on effects.
- `service`, `store`, and `rule` may import adapters. They are not pure, and they are not themselves the effect boundary.

A `util` is always pure. Expected failures remain data. The only `throw` is `assertInvariant` in the invariant Fragment under `verify-project`.

### 2.6 Category Order and Norm Names

In Fractal Branches (`*@shared`), non-private sibling Categories follow the `localHorizontalHierarchies` declared in `fafconfig.ts` (`[['_constants'], ['_schemas'], ['_types'], ['_mocks'], ['_configs'], ['_utils'], ['_norms'], ['_adapters'], ['_services'], ['_stores'], ['_rules']]`), while sibling Sub-Categories follow the general Systemic Design `horizontalHierarchies` (`[['_primitives'], ['_compounds'], ['_aggregates'], ['_systems'], ['_ecosystems']]`). Private Categories of a Fragment or Root Fragment are not ordered against each other. Each norm Fragment is named after the FAF prescription it checks. A helper used by one norm lives in that norm's Private Category.

### 2.7 Fragment Anatomy

Every Fragment consists of:

- **Master Node (`<name>.<role>.ts`)**: The sole Fragment Node bearing the Fragment's Role. It defines and exports exactly one Symbol embodying the Fragment's architectural responsibility.
- **Access Node (`index.ts`)**: The mandatory public boundary of the Fragment. It re-exports the Symbol of the Master Node (and optionally Symbols from other internal Fragment Nodes) and defines no Symbols of its own.
- **Sub-Graph Node (`<name>.spec.ts`)**: Sibling unit test entry point carrying the Sub-Graph Role `spec`.

### 2.8 Code Outside the Tree

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

- **Functional composition over inheritance**: No `class` declarations, no `this`, and no `extends`. The use of external dependency classes (such as `oxc-resolver`) is confined strictly to `*.adapter.ts` files.
- **Expected failures are data**: No exceptions for expected failures. Errors are returned as typed outcome data (`TOutcome`, discriminated unions). Every diagnostic outcome is produced exclusively through `createOutcome`, backed by the closed outcome catalog in `_conformity@shared`.
- **No `throw` statements**: The `throw` keyword is forbidden throughout the repository, with a single authorized exception: the `assertInvariant(condition, message): asserts condition` function. Invariant assertions throw a plain `Error` to immediately halt execution when an internal defect or broken assumption occurs.
- **External exception handling**: Exceptions thrown by Node.js or third-party libraries (`fs`, `import()`, `JSON.parse`) are caught inside adapters and translated into structured outcome records.
- **Boundary immutability**: All interface and type contracts use `readonly` modifiers on properties and collections. Function arguments must not be mutated.
- **Local mutation**: Local mutation is permitted exclusively on temporary data structures allocated and kept private within the executing function (e.g., Tarjan's SCC algorithm or CSR adjacency construction in `Int32Array`) to meet performance budgets.
- **Side effects**: Side effects are strictly confined to `*.adapter.ts` files.
- **Shared state**: Process state is strictly confined to `store` Fragments and encapsulated within module closures.

### 3.5 Automated Rule Enforcement

Conventions are mechanically validated by ESLint and TypeScript compiler checks:

- `repository/comment-policy`: Enforces the comment policy, flagging any comment, directive, or shebang outside `*.type.ts` JSDoc blocks.
- `jsdoc/*`: Enforces informative JSDoc documentation, absence of redundant type annotations, and valid tags (`@default`, `@example`) in `*.type.ts`.
- `@typescript-eslint/consistent-type-definitions: ['error', 'type']`: Prohibits `interface`.
- `@typescript-eslint/naming-convention`: Enforces `PascalCase` with `T` prefix on type aliases.
- `@typescript-eslint/consistent-type-assertions: ['error', { assertionStyle: 'never' }]`: Disallows `as` casts, permitting only `as const`.
- `@typescript-eslint/strict-boolean-expressions` and `@typescript-eslint/switch-exhaustiveness-check`: Ensure rigorous boolean handling and exhaustive pattern matching.
- `no-restricted-syntax`: Prohibits `ClassDeclaration`, `ClassExpression`, `ThisExpression`, and `ThrowStatement` (with the exception of `assert-invariant`).
- `repository/no-unknown-parameters`: Forbids `unknown` anywhere in a function parameter type annotation under `src/` (except `*.spec.ts`). It does not apply to `catch` clauses, local variables, or return types. A parameter `unknown` is legitimate only when the function's competence is to turn an untyped value into a typed value. The rule recognizes that competence from syntax and from the file Role, not from a path list:

  - **(a) Type guard or assertion on the same parameter.** `unknown` is allowed on a parameter `p` when the function returns `p is T` or `asserts p is T`. The return type must be explicit. Function declarations, function expressions, and arrow functions all qualify. A predicate on a different parameter does not exempt `p`.
  - **(b) File Role.** `unknown` is allowed on parameters of functions in files whose explicit Role, read from the file name as `<name>.<role>.<extension>`, is `adapter` (`*.adapter.ts`: the value arrives from an effect such as `JSON.parse`, a worker, or the disk) or `schema` (`*.schema.ts`: declarative runtime validation schemas).
  - **(c) Schema-consuming `util`.** `unknown` is allowed on parameters of functions in files whose explicit Role is `util` (`*.util.ts`) when the file imports a runtime schema from `/_schemas/` (a value `ImportDeclaration` whose specifier contains `'/_schemas/'` or ends with `'.schema.js'`).

  Every other parameter `unknown` is forbidden, including in `*.util.ts` without a runtime schema import, `*.norm.ts`, `*.service.ts`, `*.store.ts`, `*.rule.ts`, and files with no Role.

- `@typescript-eslint/no-unnecessary-condition` is enabled with `checkTypePredicates: true` in addition to its default options. A condition already decided by the types, including one passed to a type guard, is an error.
- `repository/no-decided-assertion`: forbids `assertInvariant(typeof value === 'string', ...)` (and the other `typeof` kinds) when the operand type already decides the comparison. `typeof` comparisons are typed as `boolean`, so `checkTypePredicates` does not see them.

---

## 4. Testing

### 4.1 Test Placement

- **Unit tests**: Every Fragment must include a sibling test file `<name>.spec.ts` located in the same directory as the Master Node `<name>.<role>.ts`.
- **External tests**: Acceptance tests, type assertions, and tooling verification reside in `test/` outside the Fractal Tree and interact exclusively with `src/main.ts`.

Acceptance suites use `test/support/acceptance-project.ts`: `createProject(tree, config)`, `beforeAll(warmupESLint, 120_000)`, `lintScenario(cwd, files)`, and `expectScenario(actual, expected)`, while `lintProject` exposes raw per-file diagnostics.

### 4.2 In-Memory Fixtures for Pure Roles

- Unit tests for pure Roles (`util`, `schema`, `norm`, `config`, `constant`, `type`, `mock`) use exclusively in-memory data structures. They do not touch the disk or spawn child processes.

### 4.3 Assertions

An `expect` or `expect.soft` subject that does not execute code (`CallExpression`, `NewExpression`, `AwaitExpression`, `TaggedTemplateExpression`) and whose every referenced identifier resolves, through the scope manager, to an import from `*.constant.js` or `*.config.js` is forbidden. The resolution includes namespace imports (`C.X`), arrays, objects, spreads, template literals, and `const` locals whose initializer satisfies the same condition.

Allowed:

```ts
expect(fn()).toBe(X);
expect(result.constraint).toBe(X);
expect(result.constraint).toBe('configuration/x');
expect(X.length > 0 ? f() : g());
```

Forbidden:

```ts
expect(X);
expect(C.X);
expect([X, Y]);
expect({ a: X });
expect(`${X}`);
const y = X;
expect(y);
```

Constant mutants stay killed only when the expected value is a literal on an observable output. Using an imported constant as the expected value is allowed, but it does not kill a mutant of that constant.

### 4.4 Disk Fixtures with `fs-fixture`

- Tests for adapters, services, rules, and acceptance test suites interact with real file system structures created in temporary directories using `fs-fixture`.
- Virtual or simulated file systems (such as `mock-fs` or `memfs`) are strictly prohibited because `oxc-resolver` relies on native file system calls and actual disk paths.
- Fixture creation logic relies directly on `fs-fixture` without duplicated custom fixture generator utilities.
- Create test temporary files only through `os.tmpdir()` or `fs-fixture`. The test harness places that directory outside the repository.

---

## 5. Quality Gates

The codebase enforces five sequential quality gates. All gates must pass in local verification and CI pipelines:

1. **`gate:1`** (`npm run gate:1`):
   - Formatter: Runs Prettier check across the workspace (`prettier --check`).
   - Type check: Runs TypeScript compiler without emit (`tsc --noEmit`).
2. **`gate:2`** (`npm run gate:2`):
   - Linting: Runs ESLint across the entire project including `faf/conformity` (`faf.configs.recommended`, plugin self-hosting) alongside repository convention rules (type-checked rules, comment policy, SonarJS, Unicorn, Perfectionist, and import rules).
3. **`gate:3`** (`npm run gate:3`):
   - Testing & Coverage: Runs Vitest test suite with v8 coverage analysis.
   - Strict per-file thresholds: **≥ 95% line coverage** and **≥ 90% branch coverage**.
   - Fitness tests in `test/fitness/`: Runs `test/fitness/dependency-graph.test.ts` (cycles, reachability from `src/main.ts`, and `dist/` imports). FAF edge laws are verified by `faf/conformity` in `gate:2`.
4. **`gate:4:diff`** (`npm run gate:4:diff`):
   - Mutation Testing (Diff): Runs Stryker Mutator on source files in touched `src/` directories with `--incremental --force` and its own cache `.cache/stryker/diff.json`, followed by threshold evaluation (`scripts/check-mutation-threshold.ts`).
   - Strict per-file threshold: **≥ 80% mutation score**.
   - Base comparison precedence:
     1. Explicit CLI positional argument (`npm run gate:4:diff -- <base>`).
     2. CI base environment variable (`FAF_DIFF_BASE`).
     3. Local fallback (`main`).
   - If the base reference is invalid, the command fails immediately without falling back to `HEAD`. An empty diff is an explicit success outcome without reading legacy mutation reports. The git index is never modified.
   - `src/**/*.mock.ts` is excluded from coverage and mutation because those files are test data, not production code. `*.constant.ts` and `*.config.ts` remain covered by line and branch coverage but are excluded from mutation testing. `*.schema.ts` remains covered and mutated. No other exclusions are allowed.
5. **`gate:4:incremental`** (`npm run gate:4:incremental`):
   - Centralized Incremental Mutation: Runs Stryker on the entire configured perimeter on `main` with persistent cache `.cache/stryker/incremental.json` without `--force`, executed post-integration on `main`.
   - Strict per-file threshold: **≥ 80% mutation score**.
6. **`gate:4:force`** (`npm run gate:4:force`):
   - Full Forced Mutation: Runs full mutation with `--force` on the entire configured perimeter. Executed manually only upon explicit user request.
   - Strict per-file threshold: **≥ 80% mutation score**.
7. **`gate:5`** (`npm run gate:5`):
   - Packaging & Types: Bundles the package with `tsup`, executes package export validation via `publint --strict`, and validates TypeScript declaration exports via `@arethetypeswrong/cli` (`attw -q --pack .`).

### The Binding Principle

No quality gate constraint may be weakened or bypassed. All gates must pass green prior to integration (`npm run ci`).

---

## 6. Workflow

### 6.1 Common Commands

- **Run standard continuous integration gates**:
  ```bash
  npm run ci
  ```
- **Mutate the current diff** (development, worktrees, and CI; base defaults to `main`):
  ```bash
  npm run gate:4:diff
  npm run gate:4:diff -- origin/main
  ```
- **Run incremental mutation on main** (centralized post-merge):
  ```bash
  npm run gate:4:incremental
  ```
- **Run full forced mutation** (manual request only):
  ```bash
  npm run gate:4:force
  ```
- **Run all gates with full forced mutation** (manual request only):
  ```bash
  npm run gate:all:force
  ```
- **Check types, lint, fitness, and related tests** after each Fragment. This does not replace `ci`. The base defaults to `main`:

  ```bash
  npm run check
  npm run check -- origin/main
  ```

  The command stops at the first failure. It prints each step's name, duration, and outcome, then the total duration. Steps, in order:
  1. `tsc --noEmit` on the whole project.
  2. ESLint on changed `.ts` files, tracked and untracked, deleted files excluded, with the same options as `gate:2`.
  3. Fitness tests in `test/fitness/`.
  4. Vitest tests related to the changed files (`vitest related --run`), without coverage.

  When no file changed, the lint and related steps state that there is nothing to check. The script does not modify the git index or repository files.

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

Runtime dependencies are `oxc-parser`, `oxc-resolver`, and `zod` (v4). Zod validates only untyped boundaries: the `fafconfig` format, `package.json#imports`, and the load-config worker message. `TFAFConfig` stays hand-written; schema output equivalence is checked in `test/types`.

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
