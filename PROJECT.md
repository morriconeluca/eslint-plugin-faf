# eslint-plugin-faf — Project Specificities

Complements `AGENTS.md` (FAF specification) and `faf.config.ts` (repository Declarations). Prescriptions below cover exclusively project-specific architecture, conventions, testing, and gates not derivable from those two files.

## 1. Product Contract and Runtime Boundaries

- **Normative Source**: Implements static verification for [`FAF.md`](https://github.com/morriconeluca/fractal-architecture-framework/blob/main/FAF.md).
- **Public Package Surface**: `src/main.ts` is the sole package entry. It exports the ESLint plugin (`rules.conformity`, `configs.recommended`) and re-exports `TFAFConfig` and related configuration types. There is no CLI, no programmatic API, no rule options, no severity demotion (uniform `error` / `2`), and no rule autofix (`fix` / `meta.fixable`).
- **Package Manifest Edge**: `src/main.ts` reads only `name` and `version` from `package.json` via static JSON import; no other file may import or `require` `package.json`.
- **Synchronous Execution**: ESLint discards deferred `context.report()` calls. Every stage in `faf/conformity` must remain synchronous: synchronous `node:fs`, `oxc-parser` `parseSync`, synchronous `oxc-resolver`, and synchronous `Atomics.wait` over an isolated worker thread for `faf.config.ts` evaluation (native Node.js type stripping).
- **Runtime Dependencies**: Strictly `oxc-parser`, `oxc-resolver`, and `zod` (v4). Zod is used exclusively at untyped external boundaries (`faf.config.ts` payload, `package.json#imports`, load-config worker messages). `TFAFConfig` is hand-written; bidirectional type equivalence with Zod schemas is verified in `test/types/`.

## 2. Verification Pipeline and State

- **Stage Orchestration**:
  - `prepareProject(configPath)`: `loadConfig` -> `validateConfigFormat` -> `readPackageJson` -> `acquirePathAliases` -> `composeDeclarations` -> `listEntries` -> `buildInventory` -> `includeExternalTargets` -> `validateConfigReferences`.
  - `verifyProject`: `prepareProject` -> `classifyTaxonomy` -> `deriveHorizontalHierarchies` -> `derivePublicSurface` -> `collectModules` -> `buildDependencyGraph` -> `deriveExternalCrossings` -> `_norms/*` (23 norms) -> `anchorOutcomes` -> `collectExternalFiles`.
- **Stage Independence and Failure Mode**: Pipeline stages never import one another; `verifyProject` composes them. Verification halts immediately on blocking preparation defects (configuration or inventory failure); otherwise, non-blocking preparation, taxonomy, module, graph, and norm outcomes all accumulate. The 23 Fragments under `_norms/` are mutually independent and named after the FAF prescription they check.
- **Outcome Catalog and Anchoring**: Every diagnostic outcome is constructed exclusively through `createOutcome`, backed by the closed `OUTCOME_CATALOG` in `_conformity@shared`, and deterministically projected by `anchorOutcomes` onto a single lintable file path.
- **Session Memoization and Cache**: `session` memoizes anchored outcomes per `faf.config.ts`, invalidating on watched-file fingerprints (`faf.config.ts`, its local imports, `package.json`, external files), tree origins, or in-memory `context.sourceCode.text` overlays. Content-addressed Module Records are persisted under `node_modules/.cache/eslint-plugin-faf` and cleared in memory when the active config path changes.

## 3. Role Semantics, Purity, and Placement Rules

- **Role Responsibilities** _(complementing Ranks and forms in `faf.config.ts`)_:
  - `constant`: primitive literals with zero dependencies.
  - `schema`: declarative runtime validation schemas only; must never import `.type.ts`, `_types/`, `_configs/`, `_mocks/`, or external `_utils/`.
  - `type`: static type declarations only; zero runtime code, zero value imports, mandatory JSDoc.
  - `mock`: synthetic in-memory test/sample data (excluded from coverage and mutation).
  - `config`: typed immutable domain tables and catalogs (e.g., containment matrix, `OUTCOME_CATALOG`).
  - `util`: pure functional transformations, including `.safeParse(...)` execution and error-to-outcome translation.
  - `norm`: pure FAF norm check `(model) => outcomes`.
  - `adapter`: sole boundary for side effects (`fs`, worker threads, child processes, `oxc-resolver`, `process`); catches external exceptions and translates them into structured outcomes.
  - `service`: pipeline coordination across adapters and pure stages.
  - `store`: mutable process state encapsulated in module closures.
  - `rule`: ESLint `{ meta, create }` rule module.
  - `class` and `error` Roles are intentionally omitted in favor of pure functions and typed outcome data.
- **Purity Enforced by Role** _(on `src/**/*.ts` excluding `*.spec.ts`)_:
  - Only `*.adapter.ts` may import `node:fs`/`fs`, `node:worker_threads`/`worker_threads`, `node:child_process`/`child_process`, or `oxc-resolver`, instantiate external classes, or reference `process`.
  - Pure Roles (`constant`, `schema`, `type`, `mock`, `config`, `util`, `norm`) must never import through `**/_adapters/**`.
  - Only `service`, `store`, and `rule` may import adapters.
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
    2. In `*.adapter.ts` or `*.schema.ts`.
    3. In `*.util.ts` containing a value `ImportDeclaration` from `/_schemas/` or `*.schema.js`.
  - **`repository/no-decided-assertion`**: forbids `assertInvariant(typeof x === '...')` when static operand types already decide the comparison.
- **Functional Style, Immutability, and Complexity**:
  - `class` declarations/expressions, `this`, and `throw` statements are forbidden across the repository. The single exception for `throw` is `assertInvariant` (`src/_rules/conformity/_stores/session/_services/verify-project/_verify-project@shared/_utils/assert-invariant/assert-invariant.util.ts`), reserved strictly for broken internal invariants. Expected failures are always returned as data (`TResult` / `TOutcome`).
  - All boundary types, properties, arrays, Maps, and Sets must be `readonly`; function arguments must never be mutated. Local mutation is permitted solely on private data structures allocated inside the executing function (e.g., Tarjan SCC, CSR `Int32Array`).
  - Enforced structural limits: cyclomatic complexity `<= 10`, cognitive complexity `<= 15`, boolean expression complexity `<= 3`, control-flow nesting `<= 3`, arrow parameter parentheses required, no wildcard imports (`import * as`), natural sorting enforced by `eslint-plugin-perfectionist`, and `kebab-case` ASCII naming (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Comment and `*.type.ts` Policy (`repository/comment-policy` + `jsdoc/*`)**:
  - All comments (`//`, `/* */`, JSDoc), ESLint disable comments, TypeScript directives (`@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`), triple-slash directives, and shebangs are **forbidden** everywhere, with one exception: JSDoc blocks (`/** ... */`) in `*.type.ts`.
  - In `*.type.ts`: informative JSDoc blocks (no type annotations in tags; allowed tags: `@default`, `@example`) are **mandatory** on every `type` alias and every property signature, and runtime constructs (variables, functions, enums, namespaces, expression statements, `export default`, value imports) are forbidden.

## 5. Testing Discipline

- **Unit Specs**: Every Fragment under `src/` must have a sibling `<name>.spec.ts`.
- **In-Memory Purity**: Specs for pure Roles (`constant`, `schema`, `type`, `mock`, `config`, `util`, `norm`) must use exclusively in-memory inputs (`_mocks` or inline data) and never touch the filesystem or spawn processes.
- **Real Disk Fixtures (`fs-fixture`)**: Specs for `adapter`, `service`, `rule`, and suites in `test/` must use real temporary directories via `fs-fixture` or `os.tmpdir()` ( placed outside the repository). Virtual filesystems (`memfs`, `mock-fs`) are prohibited because `oxc-resolver` performs native OS calls; do not build custom wrapper utilities around `fs-fixture`. Acceptance tests use `test/support/acceptance-project.ts` (`createProject`, `warmupESLint`, `lintScenario`, `expectScenario`, `lintProject`).
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
