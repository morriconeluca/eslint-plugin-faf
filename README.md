# @morriconeluca/eslint-plugin-faf

Official ESLint plugin for validating codebases against the **Fractal Architecture Framework (FAF)** specification.

`eslint-plugin-faf` enforces strict structural, classification, symbol, dependency, and acyclicity invariants across codebases using deterministic static analysis.

---

## Requirements

- **Node.js**: `>= 24.0.0` (required for native TypeScript type stripping)
- **ESLint**: `^9.0.0 || ^10.0.0` (flat configuration)

---

## Installation

```bash
npm install --save-dev @morriconeluca/eslint-plugin-faf eslint
```

---

## ESLint Flat Configuration

`eslint-plugin-faf` exposes a single, unified, zero-option rule: `faf/conformity`. FAF architectural constraints are non-negotiable and conjunctive: a codebase is either conformant or non-conformant. Granular rule toggles and severity demotions are not supported.

### Recommended Setup

Add the plugin to your `eslint.config.js` or `eslint.config.ts`:

```javascript
import faf from '@morriconeluca/eslint-plugin-faf';

export default [
  faf.configs.recommended,
  // ...your other flat configs
];
```

The `recommended` configuration automatically:

- Registers the `faf` plugin.
- Targets all lintable script and module extensions (`.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`).
- Enables `faf/conformity` with severity `error` (2).

### Manual Configuration

If you prefer to configure rules manually:

```javascript
import faf from '@morriconeluca/eslint-plugin-faf';

export default [
  {
    plugins: {
      faf,
    },
    rules: {
      'faf/conformity': 'error',
    },
  },
];
```

---

## The Configuration Contract: `fafconfig.ts`

Every project governed by `eslint-plugin-faf` requires a configuration module named `fafconfig.ts` located at the root of the project.

### Example Configuration

```typescript
import type { TFAFConfig } from '@morriconeluca/eslint-plugin-faf';

export default {
  faf: {
    locals: [
      {
        roles: [
          {
            name: 'constant',
            category: '_constants',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          {
            name: 'type',
            category: '_types',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          {
            name: 'mock',
            category: '_mocks',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          {
            name: 'config',
            category: '_configs',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          { name: 'util', category: '_utils' },
          { name: 'service', category: '_services' },
          { name: 'component', category: '_components' },
        ],
        subGraphRoles: [{ name: 'spec' }],
        horizontalHierarchies: [
          [
            ['_constants'],
            ['_types'],
            ['_mocks'],
            ['_configs'],
            ['_utils'],
            ['_services'],
            ['_components'],
          ],
        ],
        rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
        publicRootNodes: ['src/main.ts'],
        externalDependencies: [{ from: ['src/main.ts'], to: ['package.json'] }],
      },
    ],
  },
} satisfies TFAFConfig;
```

### Configuration Structure: `common` and `locals`

The configuration object defines:

- **`locals`** (_required_, non-empty array): Declarations specific to each Fractal Tree within the workspace. Each element must designate either a `rootFragments` array or a `rootLayers` array defining tree origins.
- **`common`** (_optional_): Shared declarations (such as roles, sub-graph roles, foreign families, or aliases) inherited by all local trees unless explicitly overridden.
- **Whole-property replacement**: When a local tree defines a property that also exists in `common`, the local property completely replaces the common definition without shallow or deep merging. Defaults apply strictly after replacement.

### Native Type-Stripping and Execution Constraints

`fafconfig.ts` is evaluated synchronously within an isolated Node.js worker thread leveraging Node's native type stripping. Because native type stripping strips type annotations without full AST transformation, configuration files must adhere to the following rules:

1. **Explicit File Extensions on Relative Value Imports**:
   Any relative value import inside `fafconfig.ts` or helper modules must specify an explicit extension (for example, `./roles.js` or `./roles.ts`). Type-only imports (`import type ...`) are erased during stripping and are exempt.
2. **Prohibition of Non-Strippable TypeScript Constructs**:
   `enum`, runtime `namespace` declarations with executable values, and constructor parameter properties are forbidden in `fafconfig.ts` and its imported dependencies. Use union types and standard property definitions.
3. **Module Packaging in `package.json`**:
   The nearest `package.json` must not declare `"type": "commonjs"`. It should specify `"type": "module"` or omit the field.
4. **Synchronous, Clonable Default Export**:
   `fafconfig.ts` must export its configuration as a synchronous `export default`. It cannot be a function, cannot return a `Promise` (no top-level asynchronous configuration), and must produce a plain data object serializable via `structuredClone`.

### Configuration Discovery and Automatic Invalidation

- **Discovery**: The plugin inspects `settings.faf.configFile` if provided in ESLint settings. If unset, it searches upward from the linter's current working directory for `fafconfig.ts`. If not found, it reports `configuration/missing-config-file` on all linted files.
- **Freshness & Invalidation**: During worker evaluation, the loader tracks all local files loaded by `fafconfig.ts`. On subsequent lint passes, the plugin compares `mtimeMs` and `size` for all tracked files. If any file changes, the configuration cache is immediately invalidated and reloaded in a fresh worker without restarting your editor or language server.

---

## Diagnostic Outcomes & Enforcement Model

### Uniform Blocking Severity

In `eslint-plugin-faf`, all diagnostic outcomes have severity **`error` (2)**. There are no warnings, hints, or demoted diagnostics.

### The 6 Outcome Families

Diagnostics belong to one of six discriminated outcome families, corresponding to message identifiers in the ESLint rule:

1. **`configuration`**: Errors in `fafconfig.ts` loading, package configuration, schema validation, literal path grammar, foreign glob syntax, or declaration inconsistencies.
2. **`classification`**: Violations of the FAF classification model, including containment matrix violations, fragment anatomy defects, missing master or access nodes, invalid horizontal hierarchies, and nomenclature non-conformities.
3. **`symbol`**: Root-scope symbol violations, such as exceeding the single-symbol rule in strict nodes, missing master exports in access nodes, or illegal re-export of imported symbols.
4. **`dependency`**: Prohibited edges or paths in the Dependency Graph, including peer separation violations, fragment encapsulation bypasses, private category or fractal branch leakage, tree opacity breaches, and unauthorized external or cross-tree dependencies.
5. **`acyclicity`**: Cycle violations detected in the logical module dependency DAG or across the inter-tree authorization DAG.
6. **`unverified`**: Incomplete checks that static analysis cannot conclusively prove (such as encountering symbolic links inside trees, unreadable origins or files, non-literal dynamic imports, unsupported syntax, or unexercised reciprocal cyclic authorizations).

### Diagnostic Message Format

Every diagnostic outcome adheres to the canonical structure:

```text
{{constraint}}: {{message}} ({{reference}}).
```

For example:

```text
dependency/fragment-encapsulation: 'src/main.ts' imports 'src/_components/button/button.component.ts' through './_components/button/button.component.js': a Fragment is importable from outside only through its index.ts (FAF §6.1.1).
```

### Deterministic Outcome Anchoring

Because ESLint can only report diagnostics on files it is currently visiting, the plugin deterministically anchors outcomes to specific files:

- **Module-Level Outcomes**: Reported directly on the affected TypeScript/JavaScript file at the exact statement or import declaration location.
- **Domain-Level & Missing-File Outcomes**: If an outcome pertains to an entire directory, a missing mandatory file (such as a missing `index.ts`), or a non-lintable asset, it is deterministically anchored to the first lintable file in lexicographical order among direct children (anchoring to the Master Node if present). If no direct child is lintable, it ascends to the nearest ancestor domain containing a lintable file.
- **Global Configuration Outcomes**: Global format errors or catalog conflicts are anchored to `fafconfig.ts`.
- **Missing Configuration File**: If `fafconfig.ts` cannot be discovered, `configuration/missing-config-file` is anchored to every file ESLint visits.
- **Partial Linting Scope Limitation**: ESLint only presents diagnostics for files included in its current invocation. Linting a single file opened in an editor might not display architectural errors anchored to other files. Comprehensive architectural conformity requires running ESLint across the entire project (e.g., in CI via `eslint .`).

---

## Scope of Verification

FAF defines both formal structural laws and qualitative design recommendations. Automated static analysis operates exclusively on deterministic source representations (ASTs, file inventories, and resolved import graphs).

The following five properties are explicitly **out of scope** for automated verification:

1. **Symbol Coherence with Role** (FAF §5): Whether the semantic responsibility of an exported function or constant truthfully matches its declared Role (e.g., distinguishing a pure `util` from a `service` when syntax alone is identical).
2. **Indivisibility of Symbols and Separation of Concerns** (FAF §6.1.2): Whether multiple Symbols grouped under an allowed multi-symbol catalog exemption are truly indivisible or constitute distinct architectural concerns.
3. **Semantic Cohesion of a Fragment** (FAF §6.1): Whether all internal files of a Fragment conceptually collaborate toward a single cohesive business responsibility.
4. **Semantic Fidelity of Mimetic Path Structures to External Addresses** (FAF §6.3.5): Whether declared Path Sub-Categories faithfully mirror real external HTTP routes or resource endpoints beyond syntactic validity.
5. **Architectural Recommendations Introduced by _"it is recommended"_ / _"è raccomandato"_** (FAF §1.2, §8): Qualitative recommendations such as placing pages next to components, placing private details as close as possible to consumers, or avoiding singleton layers.

The plugin emits **no diagnostic outcomes** and applies **no heuristics** for out-of-scope properties or recommendations.

**Conformity Certification**: The absence of diagnostic outcomes certifies architectural conformity for the entire verified scope.

---

## Operational Boundaries and Limitations

### Incompatibility with `eslint --cache`

`eslint-plugin-faf` is **fundamentally incompatible with `eslint --cache`**.

ESLint's native `--cache` flag operates on per-file timestamps. It assumes that if file `A` has not changed on disk, its lint status remains identical to the previous run. However, architectural invariants are whole-graph properties: if file `B` changes its exports or moves to another directory, file `A` (which imports file `B`) may suddenly become non-conformant even though file `A` was never modified.

**Do not run ESLint with `--cache` when validating FAF rules.**

The plugin maintains its own internal, sound caching mechanisms (memoizing module records and dependency graphs based on directory fingerprinting, `package.json`, and `fafconfig.ts`), ensuring high performance on full project runs.

### Purely Diagnostic Paradigm — Prohibition of Autofix

`eslint-plugin-faf` is strictly **diagnostic-only**:

- It provides **zero automated fixes** (`fix` functions) and zero automated refactorings.
- It will never automatically move files, create directories, rewrite imports, or synthesize barrel files.

Architectural corrections require intentional engineering judgment: deciding whether a private helper should be moved into a Private Category, extracted into a Sub-Fragment, or promoted to a Fractal Branch requires domain understanding that automated tools cannot possess.

### Static Analysis Capabilities

The plugin analyzes codebases using high-performance, deterministic static tooling:

- **TypeScript & JavaScript**: Parsed exclusively using `oxc-parser`. The plugin analyzes ESM static imports, dynamic imports with string literals (`import('...')`), CommonJS top-level `require()`, and TypeScript external references (`import x = require('...')`).
- **CSS Stylesheets**: Scanned with a dedicated parser for `@import` and `url()` references, establishing dependency edges to other stylesheets and static assets.
- **Binary Assets**: Recognized as terminal leaf nodes (sinks) with incoming edges but zero outgoing edges.
- **Boundary Resolution (`oxc-resolver`)**: Resolves module specifiers against your project's `tsconfig.json` (`paths`, `baseUrl`) and `package.json` (`imports`, `exports`). Workspace packages inside a monorepo are classified as local codebase files; external `node_modules` packages and Node.js built-ins (`node:*`) act as terminal sinks.
- **Incomplete Checks (`unverified`)**: Any unanalyzable construct (such as non-literal dynamic imports `import(variable)`, unreadable files, symbolic links inside trees, or unsupported syntax) emits a blocking `unverified/*` outcome. Incomplete checks are never treated as proof of conformity.

---

## Migration from 0.5.x (Breaking Changes)

Version `0.6.0` is a **complete ground-up rewrite** of `@morriconeluca/eslint-plugin-faf` centered around the normative Fractal Architecture Framework specification and `fafconfig.ts`. Nothing from version `0.5.x` is compatible.

### What Changed

- **Removed `settings.faf.trees`**: Tree origins, catalog roles, and hierarchies are no longer declared inside `eslint.config.js` settings. They are declared in `fafconfig.ts`.
- **Removed `faf.config.ts`**: Replaced by the standardized `fafconfig.ts` specification module.
- **Removed Granular Rules**: All legacy individual rules (`faf/no-cross-imports`, `faf/enforce-hierarchy`, `faf/symbol-rules`, etc.) have been removed. The plugin now exposes exactly one rule: `faf/conformity`.
- **Removed Legacy Configs**: Previous configurations (such as `faf.configs['flat/recommended']`) are replaced by `faf.configs.recommended`.

### Step-by-Step Migration Guide

1. **Upgrade Dependencies**:

   ```bash
   npm install --save-dev @morriconeluca/eslint-plugin-faf@^0.6.0 eslint@^9.0.0
   ```

   Ensure Node.js is `>= 24.0.0`.

2. **Create `fafconfig.ts`**:
   In your repository root, create `fafconfig.ts` implementing `TFAFConfig`:

   ```typescript
   import type { TFAFConfig } from '@morriconeluca/eslint-plugin-faf';

   export default {
     faf: {
       locals: [
         {
           roles: [
             { name: 'util', category: '_utils' },
             { name: 'component', category: '_components' },
           ],
           subGraphRoles: [{ name: 'spec' }],
           rootLayers: ['src'],
         },
       ],
     },
   } satisfies TFAFConfig;
   ```

3. **Update `eslint.config.js`**:
   Remove any legacy rules and settings. Use the new recommended preset:

   ```javascript
   import faf from '@morriconeluca/eslint-plugin-faf';

   export default [faf.configs.recommended];
   ```

4. **Update CI and Scripts**:
   Remove `--cache` from your ESLint linting scripts:
   ```json
   {
     "scripts": {
       "lint": "eslint ."
     }
   }
   ```

---

## License

MIT © [Luca Morricone](https://github.com/morriconeluca)
