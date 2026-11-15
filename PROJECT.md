# eslint-plugin-faf — Project Specificities

Complements `AGENTS.md` (FAF specification) and `faf.config.ts` (repository Declarations). Prescriptions below cover exclusively project-specific architecture, conventions, testing, and gates not derivable from those two files.

## 1. Product Contract and Runtime Boundaries

- **Normative Source**: Implements static verification for [`FAF.md`](https://github.com/morriconeluca/fractal-architecture-framework/blob/main/FAF.md).
- **Public Package Surface**: `src/main.ts` is the sole package entry. It exports the ESLint plugin (`rules.conformity`, `configs.recommended`) and re-exports `TFAFConfig` and related configuration types. There is no CLI, no programmatic API, no rule options, no severity demotion (uniform `error` / `2`), and no rule autofix (`fix` / `meta.fixable`).
- **Package Manifest Edge**: `src/main.ts` reads only `name` and `version` from `package.json` via static JSON import; no other file may import or `require` `package.json`.
- **Synchronous Execution**: ESLint discards deferred `context.report()` calls. Every stage in `faf/conformity` must remain synchronous: synchronous `node:fs`, `oxc-parser` `parseSync`, synchronous `oxc-resolver`, and synchronous `Atomics.wait` over an isolated worker thread for `faf.config.ts` evaluation (native Node.js type stripping).
- **Runtime Dependencies**: Strictly `oxc-parser`, `oxc-resolver`, and `zod` (v4). Zod is used at untyped external boundaries (e.g., `faf.config.ts` payload, `package.json`, ESLint rule `settings`, load-config worker messages, and `.cache` JSON payloads). `TFAFConfig` is hand-written; bidirectional type equivalence with Zod schemas is verified in `test/types/`.

## 2. Verification Pipeline and State

- **Stage and Norm Orchestration** _(directly inside `src/_rules/conformity/`)_:
  - `conformity` (`conformity.rule.ts` + `conformity.util.ts`) coordinates `discoverConfig` -> `session` lookup -> `resolveDeclarations` -> `buildInventory` -> `validateDeclarationReferences` -> `classifyTaxonomy` -> `deriveHorizontalHierarchies` -> `derivePublicSurface` -> `collectModules` -> `buildDependencyGraph` -> `deriveExternalCrossings` -> `_norms/*` (23 norms) -> `anchorOutcomes` -> `session` save.
- **Stage and Norm Independence and Failure Mode**: Pipeline stages (`_stages/*`) and norms (`_norms/*`) never import one another; `conformity` composes them directly without procedural umbrella Fragments. Verification halts immediately on blocking foundation defects (`discoverConfig`, `resolveDeclarations`, `buildInventory`, or `validateDeclarationReferences`); otherwise, non-blocking inventory, taxonomy, hierarchy, surface, module, graph, and norm outcomes all accumulate. The 23 Fragments under `_norms/` are mutually independent and named after the FAF prescription they check.
- **Outcome Catalog and Anchoring**: Every diagnostic outcome is constructed exclusively through `createOutcome` (exposing family-specific typed constructors over the closed `OUTCOME_CATALOG`) and deterministically projected by `anchorOutcomes` onto a single lintable file path.
- **Session Memoization and Cache**: `session` memoizes anchored outcomes per `faf.config.ts` based on file/origin fingerprints (`faf.config.ts`, its local imports, `package.json`, external files, tree origins) and in-memory `context.sourceCode.text` overlays as a peer child of `conformity`, while `collectModules` encapsulates persistent content-addressed `Module Record` caching under `node_modules/.cache/eslint-plugin-faf` via `module-record-store`.

## 3. Role Semantics, Purity, and Placement Rules

- **Project Roles** _(complementing Ranks and forms in `faf.config.ts`)_:
  - `constant`: primitive literals with zero dependencies (`isCategoryNode: true`, `allowMultipleSymbols: true`).
  - `schema`: declarative Zod runtime validation schemas (`isCategoryNode: true`, `allowMultipleSymbols: true`); must never import `type`, `config`, `mock`, or `util`.
  - `type`: static type declarations only (`isCategoryNode: true`, `allowMultipleSymbols: true`); zero runtime code, zero value imports, mandatory JSDoc.
  - `config` & `mock` _(co-ranked)_: `config` for typed immutable domain tables/catalogs (`isCategoryNode: true`, `allowMultipleSymbols: true`); `mock` for synthetic in-memory test data (`isCategoryNode: true`, `allowMultipleSymbols: true`, excluded from coverage and mutation).
  - `util`: auxiliary domain functions — pure functional transformations and, exclusively in dedicated host-boundary units, synchronous I/O (`node:fs`, `node:worker_threads`, `oxc-resolver`, `process`) catching external exceptions and translating them into structured `TResult` / `TOutcome` values (`allowMultipleSymbols: true`).
  - `norm`, `rule`, `stage`, `store` _(co-ranked at top Role Rank — Master Nodes only)_:
    - `norm`: pure FAF norm check `(model) => outcomes`.
    - `stage`: primary verification pipeline stage under `conformity/_stages/`.
    - `store`: sole modules encapsulating mutable in-memory process state in closures (`session` for fingerprint-invalidated outcome memoization; `module-record-store` encapsulated inside `collect-modules` for content-addressed `Module Record` caching).
    - `rule`: ESLint `{ meta, create }` rule module (`conformity`, directly coordinating `_stores/`, `_stages/`, and `_norms/`).
  - Per catalog minimality, Roles not required by this analyzer (and non-FAF infrastructural labels) are omitted; expected failures are modeled as typed `TResult` / `TOutcome` values.
- **Host I/O Boundary Isolation (Pure Core vs. Host I/O Leaves)** _(on `src/**/*.ts` excluding `*.spec.ts`)_:
  - `constant`, `schema`, `type`, `config`, `mock`, all 23 `norm` units, and pure model/graph stages (`validateDeclarationReferences`, `classifyTaxonomy`, `deriveHorizontalHierarchies`, `derivePublicSurface`, `buildDependencyGraph`, `deriveExternalCrossings`, `anchorOutcomes`) must remain 100% pure in memory (no `node:fs`, `node:worker_threads`, `node:child_process`, `oxc-resolver`, or `process`).
  - Host effects are confined strictly to dedicated I/O boundary units (config discovery and worker loading, `package.json` reading and directory scanning, module reading and specifier resolution, persistent `.cache/eslint-plugin-faf` I/O, and file fingerprinting).
- **Production-Only Placement and Reachability**:
  - Placement and promotion are determined exclusively by **production** consumers (`*.spec.ts` excluded).
  - Every production file in `src/` (excluding `*.spec.ts` and `*.mock.ts`) must be reachable from `src/main.ts` (enforced by `dependency-cruiser`).
  - Within a Fragment, `<name>.spec.ts` imports its sibling `./<name>.<role>.js` (and lower-Rank sibling Fragment Nodes) directly, and imports `index.ts` for Sub-Fragments or external units. A spec tests only its own Fragment and never retests Sub-Fragments.
- **Code Outside `src/`**: `test/`, `bench/`, `scripts/`, and root config files reside outside the Fractal Tree and may import exclusively `src/main.ts` (never internal `src/` modules or `dist/`).

## 4. Coding, Type, and Comment Conventions

- **Language**: English is mandatory everywhere (identifiers, paths, diagnostics, `meta.docs`, JSDoc, test descriptions, docs, changesets, commit messages), preserving exact FAF terms (`Fragment`, `Access Node`, `Fractal Branch`, `Root Node`, `Logical Node`, `Foreign Node`, etc.).
- **Type System (`tsconfig.json` + ESLint)**:
  - Use `type` aliases exclusively (`interface` is forbidden). Every declared type alias must use `PascalCase` with a leading `T` prefix (e.g., `TOutcome`). Imported third-party types (`Rule`, `ESLint.Plugin`, `oxc-parser` AST types) keep their original names without `T` renaming.
  - Explicit module boundary types are required.
  - `erasableSyntaxOnly` & `verbatimModuleSyntax`: no `enum`, no runtime `namespace`, no parameter properties; use `import type` / `export type` and explicit `.js` extensions on relative TypeScript imports (`NodeNext`).
  - Type assertions (`as T`) are forbidden (`assertionStyle: 'never'`); only `as const` is permitted.
  - Strict boolean expressions (no implicit coercion on strings, numbers, or nullable objects), exhaustive `switch` statements, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, and `@typescript-eslint/no-unnecessary-condition` (`checkTypePredicates: true`).
  - **`repository/no-unknown-parameters`**: `unknown` in function parameter annotations under `src/` (excluding `*.spec.ts`) is forbidden except:
    1. On a parameter `p` when the function declares an explicit return type predicate `p is T` or `asserts p is T`.
    2. In `*.schema.ts` or in `*.util.ts` importing a runtime schema (`/_schemas/` or `*.schema.js`).
  - **`repository/no-decided-assertion`**: forbids `assertInvariant(typeof x === '...')` when static operand types already decide the comparison.
- **Functional Style, Immutability, and Complexity**:
  - `class` declarations/expressions, `this`, and `throw` statements are forbidden across the repository. The single exception for `throw` is `assertInvariant` (`assert-invariant.util.ts`), reserved strictly for broken internal invariants. Expected failures are always returned as data (`TResult` / `TOutcome`).
  - Module-level IIFE closures (`(() => { ... })()`) are reserved exclusively for stateful `store` modules (`session.store.ts`, `module-record-store.store.ts`); stateless modules never wrap top-level declarations in an IIFE.
  - All boundary types, properties, arrays, Maps, and Sets must be `readonly`; function arguments must never be mutated. Local mutation is permitted solely on private data structures allocated inside the executing function (e.g., Tarjan SCC, CSR `Int32Array`).
  - Enforced structural limits: cyclomatic complexity `<= 10`, cognitive complexity `<= 15`, boolean expression complexity `<= 3`, control-flow nesting `<= 3`, arrow parameter parentheses required, no wildcard imports (`import * as`), natural sorting enforced by `eslint-plugin-perfectionist`, and `kebab-case` ASCII naming (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Comment and `*.type.ts` Policy (`repository/comment-policy` + `jsdoc/*`)**:
  - All comments (`//`, `/* */`, JSDoc), ESLint disable comments, TypeScript directives (`@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`), triple-slash directives, and shebangs are **forbidden** everywhere, with one exception: JSDoc blocks (`/** ... */`) in `*.type.ts`.
  - In `*.type.ts`: informative JSDoc blocks (no type annotations in tags; allowed tags: `@default`, `@example`) are **mandatory** on every `type` alias and every property signature, and runtime constructs (variables, functions, enums, namespaces, expression statements, `export default`, value imports) are forbidden.

## 5. Testing Discipline

- **Unit Specs**: Every Fragment under `src/` must have a sibling `<name>.spec.ts`.
- **In-Memory Purity**: Specs for all pure units (`constant`, `schema`, `type`, `config`, `mock`, `norm`, pure `stage` units, and pure `util` units) must use exclusively in-memory inputs (`_mocks` or inline data) without touching the filesystem or spawning processes.
- **Real Disk Fixtures (`fs-fixture`)**: Specs for host I/O units, `conformity` (`rule`), and suites in `test/` must use real temporary directories via `fs-fixture` or `os.tmpdir()` (placed outside the repository). Virtual filesystems (`memfs`, `mock-fs`) are prohibited because `oxc-resolver` performs native OS calls; do not build custom wrapper utilities around `fs-fixture`. Acceptance tests use `test/support/acceptance-project.ts` (`createProject`, `warmupESLint`, `lintScenario`, `expectScenario`, `lintProject`).
- **Non-Tautological Assertions (`repository/no-tautological-assertion`)**: `expect` / `expect.soft` subjects that execute no code (`CallExpression`, `NewExpression`, `AwaitExpression`, `TaggedTemplateExpression`) and whose referenced identifiers all resolve to `*.constant.js` or `*.config.js` imports (directly or via `const` locals/containers) are forbidden. Assert observable outputs against literal expected values so constant/string mutants are killed.

## 6. Quality Gates and Commands

No quality gate or threshold may be weakened or bypassed; `npm run ci` must pass before integration:

1. **`gate:1`** (`npm run gate:1`): `prettier --check` + `tsc --noEmit`.
2. **`gate:2`** (`npm run gate:2`): `eslint .` (including self-hosted `faf/conformity` and all repository/type-checked rules).
3. **`gate:3`** (`npm run gate:3`): `vitest run --coverage` (**`>= 95%` lines** and **`>= 90%` branches per file** on `src/**/*.ts`, excluding `*.mock.ts`, `*.spec.ts`, `*.type.ts`) + `test/fitness/dependency-graph.test.ts` (no cycles, full reachability from `src/main.ts`, no `dist/` imports).
4. **`gate:4:diff`** (`npm run gate:4:diff [-- <base>]`): Stryker diff mutation on touched `src/` directories (**`>= 80%` mutation score per file**; `*.config.ts`, `*.constant.ts`, `*.mock.ts`, `*.spec.ts`, `*.type.ts` excluded; `*.schema.ts` included). Base resolution order: CLI arg -> `FAF_DIFF_BASE` -> `main` (fails immediately on invalid ref; never modifies git index).
5. **`gate:5`** (`npm run gate:5`): `tsup && publint --strict && attw -q --pack .`.

- **Additional Commands**:
  - `npm run check [-- <base>]`: fast per-Fragment loop (`tsc --noEmit` -> `eslint` on changed `.ts` files -> `test/fitness` -> `vitest related --run`; base defaults to `main`).
  - `npm run sanitize`: `eslint --fix .` + `prettier --write .`.
  - `npm run gate:4:incremental`: post-merge incremental mutation on `main` (`>= 80%` per file).
  - `npm run gate:4:force` / `npm run gate:all:force`: full forced mutation — **execute manually only upon explicit user request**.
- **Commits & Releases**: Conventional Commits (`<type>(<scope>): <description>`) enforced by Husky + Commitlint; user-facing or architectural changes require `npx changeset`.
