# Architectural & Verification Decisions

This document records architectural, verification, and operational decisions of `eslint-plugin-faf` that are not determined by the Fractal Architecture Framework specification (`FAF.md`). It distinguishes the plugin's operational policies and static analysis boundaries from normative FAF rules, serving as the authoritative reference for users, contributors, and maintainers.

---

## D-01: Scope of Verification — Exclusion of Semantic Properties and Recommendations

### Context

`FAF.md` defines both formal structural rules and qualitative design guidelines. Static analysis operates exclusively on deterministic source representations (AST, configuration, filesystem inventory, and resolved import graphs). Certain architectural properties require semantic interpretation or business context that cannot be derived mechanically without arbitrary heuristics.

### Decision

The plugin will strictly verify properties that can be deterministically parsed, calculated, or refuted from `fafconfig.ts`, the filesystem inventory, source module records, and the resolved dependency graph.

The following properties are explicitly **out of scope** for automated verification:

1. **Symbol Coherence with Role** (FAF §5): Whether the semantic responsibility of an exported function or constant truthfully matches its declared Role (e.g., distinguishing a pure `util` from a `service` or `hook` when syntax alone is identical).
2. **Indivisibility and Separation of Concerns** (FAF §6.1.2): Whether multiple Symbols grouped under an allowed multi-Symbol exemption are truly indivisible or constitute distinct architectural responsibilities.
3. **Fragment Cohesion** (FAF §6.1): Whether all internal files of a Fragment conceptually collaborate toward a single cohesive responsibility.
4. **Semantic Fidelity of Mimetic Path Structures** (FAF §6.3.5): Whether declared Path Sub-Categories faithfully mirror real external HTTP routes or resource endpoints beyond syntactic validity.
5. **Architectural Recommendations** (FAF §1.2): Any clause introduced by "it is recommended" / "_è raccomandato_" (e.g., placing pages next to components, placing private details as close as possible to consumers, or avoiding singleton Layers).

The plugin will emit **no diagnostic outcomes** and will apply **no heuristics** for out-of-scope properties or recommendations.

### Rationale

Automated static analysis must remain falsifiable, deterministic, and free of false positives. Emitting warnings or heuristic errors on subjective design choices would undermine confidence in the tool. According to FAF §1.2, recommendations do not affect compliance; only normative rules and declared Declarations determine conformity.

### Observable Consequences

- Zero diagnostic outcomes (errors or warnings) will be emitted for out-of-scope properties or disregarded recommendations.
- The absence of diagnostic outcomes certifies conformity for the entire verified scope. The plugin does not certify or attest to out-of-scope properties.
- When all structural, naming, and dependency checks pass, verification completes successfully (`ok: true`).

### Normative References

- `FAF.md`: §1.2, §5, §6.1, §6.1.2, §6.3.5, §8.1, §8.2, §8.4.

---

## D-02: Single Rule (`faf/conformity`) and Uniform Blocking Diagnostic Families

### Context

ESLint plugins often expose numerous rules with configurable severity levels (`warn`, `error`) and granular options. FAF rules, however, form a coherent, conjunctive system of architectural invariants where no rule may be silenced or demoted without compromising structural integrity.

### Decision

1. **Single ESLint Rule**: The plugin will expose exactly one ESLint rule, `faf/conformity`, enabled as `error` in `configs.recommended`, with zero configuration options.
2. **Uniform Severity**: All diagnostic outcomes are strictly blocking (`error`, severity 2). No warnings (`warn`) or suggestions exist.
3. **Outcome Families**: Diagnostic outcomes are grouped into three conceptual families:
   - **Configuration Errors** (`configuration`): Invalid structure, type mismatches, or malformed declarations in `fafconfig.ts`.
   - **Demonstrated Violations** (`classification`, `symbol`, `dependency`, `acyclicity`): Concrete, proven infringements of FAF structural, naming, visibility, or graph laws.
   - **Unverified Checks** (`unverified`): Analysis that cannot be decisively completed due to missing data, unresolvable paths, or unexercised ambiguous declarations.
4. **Structural Message Identifiers**: At the ESLint rule level, `meta.messages` will define six message identifiers corresponding to the `TOutcomeFamily` discriminated union:
   - `configuration`: Settings syntax, type, and format violations.
   - `classification`: File/directory classification failures, containment matrix violations, and nomenclature errors.
   - `symbol`: Root-scope symbol count violations, non-exempt multi-symbol files, and unauthorized re-exports.
   - `dependency`: Unauthorized imports across boundary planes (peer separation, fragment encapsulation, private category, fractal branch, tree frontier).
   - `acyclicity`: Circular dependencies detected in the dependency graph, transitive branch return loops, or inter-Tree cycles.
   - `unverified`: Incomplete verification due to unresolved imports, non-literal dynamic imports, unreadable files, or filesystem symlinks.

### Rationale

FAF architectural constraints are non-negotiable and conjunctive: a codebase is either conformant or non-conformant. Granular rule configuration invites selective deactivation of core invariants. Partitioning outcomes into discriminated families preserves exact diagnostic context while maintaining an uncompromising standard of enforcement.

### Observable Consequences

- ESLint configuration requires only `plugins: { faf }, rules: { 'faf/conformity': 'error' }`.
- Every diagnostic reported to ESLint has `severity: 2`.
- Diagnostics carry a structured `family` and a specific `constraint` identifier (e.g., `dependency/peer-separation`, `symbol/symbol-uniqueness`, `classification/containment-matrix`).
- Configuration diagnostics include the exact `propertyPath` (e.g., `faf.locals[0].roles[1].name`).

### Normative References

- `FAF.md`: §1.2, §5, §6, §7.

---

## D-03: Treatment of Incomplete Checks as Blocking `unverified` Diagnostics

### Context

Static analysis occasionally encounters source code constructs or environmental conditions that prevent static verification, such as unresolvable module specifiers, dynamic imports with non-literal expressions, unreadable external files, or missing declaration files.

### Decision

Whenever the plugin cannot complete a verification check due to missing information, unanalyzable syntax, or filesystem limitations, it emits a blocking diagnostic outcome in the `unverified` family (`family: 'unverified'`). It never treats an incomplete check as proof of conformity, nor does it invent a speculative violation.

Key instances producing `unverified` outcomes:

- **Implemented in Codebase**:
  - **Symbolic Links within Trees**: Symbolic links encountered within an inventoried tree origin are not traversed, and the inventory collector emits `constraint: 'unverified/symbolic-link'`.
  - **Unreadable Origin Directories**: Tree origins that cannot be read due to filesystem I/O errors emit `constraint: 'unverified/unreadable-origin'`.
  - **Unreadable Directory Entries**: Entries or subdirectories within an origin that cannot be inspected emit `constraint: 'unverified/unreadable-entry'`.
  - **Configuration Loading Timeout**: Evaluation of `fafconfig.ts` in the worker thread exceeding the execution budget emits `constraint: 'unverified/config-loading-timeout'`.
- **Planned for Future Analysis Stages**:
  - **Unresolved Imports**: Specifiers that cannot be resolved to a known codebase file, workspace package, or external package via `oxc-resolver` will emit `constraint: 'unverified/unresolved-import'`.
  - **Non-Literal Dynamic Imports**: `import(expression)` calls where the module specifier cannot be statically determined as a string literal will emit `constraint: 'unverified/non-literal-dynamic-import'`.
  - **Unreadable External Files**: Local external files reached during graph traversal that cannot be accessed or parsed will emit `constraint: 'unverified/unreadable-external-file'`.
  - **Missing or Ambiguous Data**: Missing required declaration context or unclassifiable references will emit `constraint: 'unverified/missing-data'`.
  - **Unsupported File Types**: Imported files whose extension or format lacks an available parser or extractor will emit `constraint: 'unverified/unsupported-file-type'`.
  - **Unsupported Syntax**: Syntactic constructs within recognized files that cannot be parsed by available extractors will emit `constraint: 'unverified/unsupported-syntax'`.
  - **Unexercised Cyclic Tree Authorizations**: Reciprocal authorizations declared between Trees without physical import cycles will emit `constraint: 'unverified/cyclic-tree-authorization'`.
  - **Unexercised Cyclic Root Authorizations**: Reciprocal authorizations declared between Root Fragments without physical import cycles will emit `constraint: 'unverified/cyclic-root-authorization'`.

### Rationale

A check that cannot be completed is not proof of conformity. Silently ignoring unresolvable imports would allow illegal dependencies to escape notice. Conversely, reporting an unverifiable check as a demonstrated violation (e.g., `dependency/peer-separation`) would be factually incorrect. Emitting a dedicated, blocking `unverified` diagnostic marks verification as failed (`ok: false`) without inventing speculative violations, demanding explicit resolution from the developer.

### Observable Consequences

- Any unverifiable condition produces a diagnostic with `family: 'unverified'`.
- The verification pipeline completes with `ok: false`, preventing non-verifiable code from passing CI gates.
- Diagnostics explicitly provide the technical `reason` for the verification limitation.

### Normative References

- `FAF.md`: §1.2, §4, §5, §7.3.

---

## D-04: Unexercised Cyclic Authorizations Between Trees and Between Root Fragments

### Context

`fafconfig.ts` allows explicit dependency authorization between separate Fractal Trees (`treeDependencies`) and between distinct Root Fragments (`rootFragments[].dependencyEdges`). In some codebases, the configuration may declare reciprocal or cyclic authorizations (e.g., Tree A is authorized to import Tree B, and Tree B is authorized to import Tree A), while the actual source code contains only one-way imports or no imports at all.

### Decision

1. **No Phantom Graph Cycles**: If the actual source code dependency graph is acyclic, the plugin will **not** report an acyclicity violation (`acyclicity/*`). An import cycle must be physically present in the module graph to constitute an acyclicity violation.
2. **Unexercised Cyclic Authorizations**: When reciprocal authorizations exist without physical cycles in code, the plugin will emit an explicit diagnostic in the `unverified` family:
   - For reciprocal authorizations between separate Trees (`treeDependencies`), the plugin will emit `constraint: 'unverified/cyclic-tree-authorization'`.
   - For reciprocal authorizations between distinct Root Fragments (`rootFragments[].dependencyEdges`), the plugin will emit `constraint: 'unverified/cyclic-root-authorization'`.
3. **Strict Prohibition on Real Cycles**: If actual source imports exercise both directions and form a physical cycle, the plugin will immediately emit a demonstrated acyclicity violation with the complete cycle chain:
   - For physical import cycles between separate Trees, the plugin will emit `constraint: 'acyclicity/inter-tree-cycle'`.
   - For physical import cycles between distinct Root Fragments, the plugin will emit `constraint: 'acyclicity/root-dependency-cycle'`.

### Rationale

FAF §5 and §7.2 mandate that the Dependency Graph must be a Directed Acyclic Graph (DAG). However, FAF does not formally define whether an unused authorization configuration constitutes an invalid authorization DAG or an unexercised potential relationship. Reporting an import cycle when no actual imports exist would misrepresent the source code. Silently approving reciprocal authorizations would risk latent cycles. Emitting an `unverified` outcome explicitly highlights the architectural ambiguity without inventing phantom edges.

### Observable Consequences

- Reciprocal configuration authorizations between Trees without reciprocal imports will produce `family: 'unverified'` with `constraint: 'unverified/cyclic-tree-authorization'`.
- Reciprocal configuration authorizations between Root Fragments without reciprocal imports will produce `family: 'unverified'` with `constraint: 'unverified/cyclic-root-authorization'`.
- Code is blocked from passing as conformant until the reciprocal authorization is clarified or removed.
- If reciprocal imports are introduced in code, an `acyclicity` violation is emitted with the exact cycle witness chain (`acyclicity/inter-tree-cycle` or `acyclicity/root-dependency-cycle`).

### Normative References

- `FAF.md`: §5, §6.2.2, §7.2.

---

## D-05: Naming Grammar, Literal Path Syntax, and Foreign Pattern Grammar

### Context

`FAF.md` mandates kebab-case for units and organizational elements and defines the usage of leading underscores for non-public domains, but does not formalize lexical limits on acronyms, numbers, Unicode characters, or pattern matching in configuration files.

### Decision

1. **Plugin Kebab-Case Grammar**:
   - The plugin enforces the strict ASCII regular expression:
     ```regexp
     ^[a-z0-9]+(?:-[a-z0-9]+)*$
     ```
   - **Allowed**: Lowercase ASCII letters (`a-z`), digits (`0-9`), and single hyphens `-` between alphanumeric characters.
   - **Initial Digits**: Digits are permitted at the beginning of names and segments (e.g., `2fa-service`, `3d-canvas`).
   - **Disallowed**: Uppercase letters, Unicode/diacritics, consecutive hyphens (`--`), leading or trailing hyphens, and underscores (except for designated structural prefixes).
   - **Acronyms**: Must be fully lowercase without special casing (e.g., `http-client`, `json-parser`, `id`, `uuid`).
   - This grammar applies to Fragment names, Master Node names, Fragment Node names, Category names (after stripping the leading `_`), Action Catalog entries, and Mimetic target names.
2. **Literal Configuration Path Grammar**:
   - Declared paths in `fafconfig.ts` must be POSIX relative paths from the configuration directory.
   - Evaluated via `isLiteralConfigPath`: paths must not contain empty segments (`//`), dot segments (`.`), or parent directory segments (`..`), except that the single string `.` is permitted to denote the configuration directory root.
   - Backslashes `\` are strictly prohibited.
3. **Foreign Pattern Grammar**:
   - Glob patterns in `foreignFamilies` are validated and compiled via `compileForeignPattern` into a safe, deterministic subset:
     - `*`: Matches characters within a single filename or segment.
     - `?`: Matches exactly one character.
     - `**`: Matches zero or more nested directory segments (must appear as standalone segment `/**/` or edge prefix/suffix).
     - Literal brackets `[` and `]`.
   - **Prohibited Patterns and Rejection Reasons**:
     - `empty-pattern`: Empty pattern string.
     - `negation`: Patterns starting with `!`.
     - `brace-expansion`: Patterns containing `{` or `}`.
     - `regular-expression`: Patterns starting with `^`, ending with `$`, or wrapped in `/.../`.
     - `absolute-pattern`: Patterns starting with `/`.
     - `empty-segment`: Segments of zero length (e.g. `//`).
     - `dot-segment`: Segments equal to `.` or `..`.
     - `invalid-globstar`: Globstars adjacent to non-slash characters or containing 3 or more asterisks (`***`).

### Rationale

Cross-platform filesystem inconsistencies (case insensitivity on macOS/Windows, Unicode normalization variations) cause subtle deployment defects. A strict ASCII alphanumeric kebab-case policy eliminates ambiguity. Bounding foreign patterns to a simple, deterministic glob subset prevents ReDoS vulnerabilities and unpredictable matching behavior.

### Observable Consequences

- A file, directory, or Fragment name on the filesystem that deviates from the kebab-case grammar will emit `classification/invalid-nomenclature`.
- A declared identifier in `fafconfig.ts` (such as a role name) that violates naming syntax will emit `configuration/invalid-naming-syntax`.
- Malformed paths in `fafconfig.ts` will emit `configuration/invalid-literal-path`.
- Non-compliant foreign patterns will emit `configuration/invalid-foreign-pattern` with the specific rejection reason (`empty-pattern`, `negation`, `brace-expansion`, `regular-expression`, `absolute-pattern`, `empty-segment`, `dot-segment`, `invalid-globstar`).

### Normative References

- `FAF.md`: §4, §6.1, §6.3, §6.6, §6.7.
- Configuration Format: CONFIG_6, CONFIG_10.

---

## D-06: Physical Filesystem Identity, Symbolic Link Handling, and Origin Validation

### Context

Symbolic links can map files or directories from one location to another. If followed indiscriminately, a symlink can cause a single file to appear in multiple architectural positions simultaneously, circumventing containment matrices, encapsulation boundaries, and acyclicity checks.

### Decision

1. **Canonical Physical Identity**: The plugin resolves all filesystem entries to their canonical physical identity using `realpath`.
2. **Non-Traversal of Symbolic Links and Diagnostic Emission**:
   - Any symbolic link located inside an inventoried Fractal Tree is **not traversed** into its target.
   - The verification process continues without halting, and the inventory collector emits a blocking `unverified` diagnostic outcome:
     - `constraint`: `'unverified/symbolic-link'`
     - `family`: `'unverified'`
     - `normativeReference`: `'§6'`
     - `element`: The relative path of the symbolic link inside the tree.
     - `reason`: The resolved physical destination path (`realPath`).
3. **Tree Origin Validation and Filesystem Errors**:
   - During tree origin scanning, origin directories are verified:
     - If a declared tree origin does not exist on disk, the scanner emits `constraint: 'configuration/missing-origin'`.
     - If a declared tree origin exists but is not a directory (even after resolving symlinks), it emits `constraint: 'configuration/invalid-origin'`.
     - If a declared tree origin cannot be accessed due to filesystem I/O permissions or OS errors, it emits `constraint: 'unverified/unreadable-origin'`.
     - If a subdirectory or directory entry within an origin cannot be read or inspected, it emits `constraint: 'unverified/unreadable-entry'`.
   - During configuration declaration composition:
     - If the same origin path is declared more than once with the same kind, it emits `constraint: 'configuration/duplicate-origin'`.
     - If the same origin path is declared as both a Root Layer and a Root Fragment, it emits `constraint: 'configuration/conflicting-origin-kind'`.
     - If an origin path is nested within or overlaps another declared origin path, it emits `constraint: 'configuration/overlapping-origins'`.

### Rationale

FAF architectural laws rely on strict tree containment and hierarchical ancestry. A symlink creates an architectural alias: a file could simultaneously be classified as a private utility inside Fragment A and an Access Node in Fragment B. Following symlinks would either produce contradictory classifications or allow unauthorized imports to bypass boundary checks. By refusing to traverse symlinks and recording `unverified/symbolic-link`, the plugin avoids phantom duplicate nodes while ensuring that architectural topology strictly mirrors physical storage. Continuing verification allows the linter to surface all other diagnostic issues in the same run.

### Observable Consequences

- Any symlink inside a tree emits `unverified/symbolic-link` and is not traversed. Verification is not halted mid-flight; all entries and outcomes are collected.
- Invalid, unreadable, duplicate, or overlapping tree origins produce the corresponding `configuration/*` or `unverified/*` diagnostics.

### Normative References

- `FAF.md`: §6, §6.9, §7.1.
- Configuration Format: CONFIG_5.

---

## D-07: Static Analysis Capabilities: Supported Languages, Loaders, and Assets

### Context

Real-world TypeScript projects frequently include assets, CSS, dynamic imports, and non-code files. An architectural linter must explicitly define what syntactic constructs it parses and how different file types participate in the dependency graph.

### Decision

1. **TypeScript / JavaScript (`oxc-parser`)**:
   - The plugin will parse TS/JS files exclusively with `oxc-parser` (`parseSync`). The ESLint parser's AST is ignored to guarantee uniformity.
   - **Supported constructs producing dependency edges**:
     - ESM static imports: `import defaultExport from '...'`, `import { a } from '...'`, `import * as ns from '...'`, `import type { T } from '...'`.
     - Static dynamic imports with string literals: `import('specifier')`.
     - CommonJS top-level bindings: `const x = require('specifier')`.
     - TypeScript external module references: `import x = require('specifier')` and inline type queries `import('specifier').Type`.
   - **Symbol counting**: Evaluated in the root scope according to FAF §4 (classes, functions, variables, type aliases, interfaces, enums).
   - **Export provenance**: Tracks whether an export is a local definition or a re-export of an imported symbol.
   - **Unsupported dynamic imports**: Dynamic expressions where the specifier is not a string literal (e.g. `import(variable)`) will emit `constraint: 'unverified/non-literal-dynamic-import'`.
2. **CSS and Variants (Dedicated CSS Scanner)**:
   - The plugin will scan stylesheets for `@import "..."`, `@import url("...")`, and `url("...")` references, respecting comments and string escapes.
   - Produces dependency edges to other stylesheets or static assets.
3. **Binary Assets (Images, Fonts, Media, Documents)**:
   - Treated as leaf Asset nodes with **zero outgoing edges** (terminal nodes).
   - Can receive incoming edges (e.g., imported by a TS component or CSS file).
4. **Unsupported Syntax and File Types**:
   - If an imported file has an extension or file type for which no extractor is available, the plugin will emit `constraint: 'unverified/unsupported-file-type'`.
   - If a file contains syntax constructs that cannot be parsed by available extractors, the plugin will emit `constraint: 'unverified/unsupported-syntax'`.
   - The absence of an extractor is never treated as a pass.

### Rationale

Architectural analysis must be predictable and statically verifiable. Relying on heuristic AST interpretations or pretending dynamic expressions do not exist would allow unauthorized dependencies to slip through. Declaring explicit capabilities ensures that users understand the verified boundaries.

### Observable Consequences

- TS/JS modules will be fully verified for symbols, imports, and re-exports.
- CSS files will track stylesheet dependencies.
- Binary assets will be recognized as leaf nodes without outgoing edges.
- Non-literal dynamic imports will emit `unverified/non-literal-dynamic-import`.
- Unsupported file types will emit `unverified/unsupported-file-type`.
- Unsupported syntax will emit `unverified/unsupported-syntax`.

### Normative References

- `FAF.md`: §4, §5, §6.1, §6.7.

---

## D-08: Codebase vs External Libraries Boundary Resolution via `oxc-resolver`

### Context

In modern workspaces (monorepos with npm, pnpm, or yarn), internal packages are often symlinked under `node_modules` or referenced via package names defined in `package.json#imports` or `tsconfig.json#paths`. The plugin must distinguish true third-party libraries from local codebase modules.

### Decision

1. **Project-Consistent Resolution**: Module specifiers will be resolved using `oxc-resolver`, configured to respect the project's actual resolution environment (`tsconfig.json` compiler options `paths`, `baseUrl`, `moduleResolution`, and package `exports`/`imports`).
2. **Physical Location Classification**:
   - **Local Codebase Node**: If a specifier resolves via `realpath` to a file within any declared Fractal Tree, it is classified as a Tree Node.
   - **Local External File**: If a specifier resolves to a physical file inside the project workspace/repository base but outside all declared Fractal Tree origins, it is classified as a Local External File (subject to `externalDependencies` authorization). Workspace packages residing inside the monorepo are treated as local code, not external libraries.
   - **External Library**: A specifier is classified as an External Library if:
     - It is a Node.js built-in module (e.g., `node:fs`, `node:path`, `path`).
     - It resolves to a file inside `node_modules` located outside the local project codebase.
       External libraries act as terminal sinks with no outgoing edges tracked into the codebase.
   - **Unresolved Imports**: If resolution fails, the plugin will emit `constraint: 'unverified/unresolved-import'`.

### Rationale

Treating workspace packages as external third-party libraries would allow teams to bypass FAF architectural laws simply by creating a local package boundary. Resolving to physical canonical paths ensures that all first-party code written in the workspace is governed by FAF rules.

### Observable Consequences

- Imports to local workspace packages will be checked against tree boundaries and `externalDependencies`.
- Third-party packages (e.g., `react`, `lodash`) and `node:` built-ins will be recognized as external sinks.
- Unresolved imports will produce blocking `unverified/unresolved-import` diagnostics.

### Normative References

- `FAF.md`: §5, §7.1, §7.2, §7.3, §7.4.

---

## D-09: Discovery, Synchronous Worker Loading, Type-Stripping Constraints, and Invalidation of `fafconfig.ts`

### Context

ESLint rules execute synchronously. However, `fafconfig.ts` is an author-written TypeScript configuration module that must be dynamically evaluated. Furthermore, running configuration code in the main linter thread risks polluting global state, while running external compilation tooling causes noticeable latency.

### Decision

1. **Configuration Discovery**:
   - The plugin inspects `settings.faf.configFile` if provided in ESLint settings.
   - If unset, it searches upwards from the linter's current working directory (`cwd`) for `fafconfig.ts`.
   - If the configuration file cannot be found at the explicit path or in any parent directory, it emits `constraint: 'configuration/missing-config-file'`.
2. **Synchronous Worker Execution**:
   - The configuration is evaluated inside an isolated Node.js `Worker` thread using Node's native type stripping (`--experimental-strip-types` / native strip support in Node >= 24).
   - The main thread blocks synchronously using `Atomics.wait` on a `SharedArrayBuffer` with an execution timeout budget (default 30,000ms), and retrieves the payload with `receiveMessageOnPort`.
   - If worker execution exceeds the timeout budget, it emits `constraint: 'unverified/config-loading-timeout'`.
   - The worker is terminated immediately in a `finally` block after message retrieval.
3. **Type-Stripping and Loading Constraints**:
   - Because native type stripping strips type annotations without AST transformation, `fafconfig.ts` and its local imports must adhere to:
     - **No Non-Strippable TypeScript**: `enum`, runtime `namespace`, and class parameter properties produce `constraint: 'configuration/unsupported-typescript-syntax'`.
     - **Explicit File Extensions**: Relative imports of local values must include explicit extensions (e.g., `./roles.ts`). Violations produce `constraint: 'configuration/unresolved-relative-import'`. (Type imports `import type` are erased and exempt).
     - **Module Type in Package JSON**: The nearest `package.json` must not declare `"type": "commonjs"`. Violations produce `constraint: 'configuration/commonjs-package-type'`. If `package.json` is not a regular file or contains invalid JSON, it emits `constraint: 'configuration/invalid-package-json'`.
     - **Export Default Requirements**:
       - The configuration file must provide an `export default`. A missing default export produces `constraint: 'configuration/missing-default-export'`.
       - The default export cannot be a function; a function export produces `constraint: 'configuration/invalid-default-export-function'`.
       - The default export cannot be a Promise; an asynchronous default export produces `constraint: 'configuration/invalid-default-export-promise'`.
       - The default export value must be serializable via structured clone. Unclonable objects produce `constraint: 'configuration/unclonable-config-value'`.
     - **General Loading Failure**: Any other runtime exception or import failure encountered during worker evaluation produces `constraint: 'configuration/config-load-failure'`.
4. **Freshness and Invalidation**:
   - The worker records all local files loaded during evaluation (via `module.registerHooks`).
   - On subsequent lint runs, the plugin inspects the `mtimeMs` and `size` of `fafconfig.ts` and all loaded dependencies. If any file has changed, the configuration cache is invalidated and reloaded in a fresh worker.

### Rationale

Spawning an ephemeral worker thread isolates the linter from configuration side effects while enabling synchronous retrieval via `Atomics.wait`. Native type stripping eliminates build dependencies and operates in milliseconds. Automatic cache invalidation based on file timestamps guarantees that developers see configuration changes immediately without restarting IDE language servers.

### Observable Consequences

- `fafconfig.ts` loads synchronously with zero pre-compilation step.
- Syntax, extension, packaging, or export incompatibilities produce descriptive `configuration/*` diagnostics with `propertyPath: 'default'`, `propertyPath: 'settings.faf.configFile'`, or `propertyPath: 'faf'`.
- Evaluation timeouts produce `unverified/config-loading-timeout`.
- Modifying `fafconfig.ts` or any imported helper immediately refreshes the active configuration on the next lint run.

### Normative References

- Configuration Format: CONFIG_1.

---

## D-10: Deterministic Outcome Anchoring and Partial Linting Scope

### Context

ESLint rules can only report diagnostics on files that ESLint is currently visiting. In FAF, many violations are structural, directory-level, or relate to missing files (e.g., a missing `index.ts` in a Fragment, an invalid Category directory, or a missing `fafconfig.ts`).

### Decision

1. **Deterministic Anchoring Algorithm**:
   Every diagnostic outcome will be deterministically anchored to exactly one lintable file:
   - **Lintable File Diagnostics**: If an outcome pertains directly to a JS/TS file (e.g., an illegal import or a symbol count violation), it will be anchored to that file at the specific statement location.
   - **Domain-Level and Missing File Diagnostics**: If an outcome pertains to a directory domain, a missing required file, or a non-lintable asset, it will be anchored to the first lintable file in lexicographical order among the direct children of the affected domain. For a Fragment, it anchors to the Master Node if present. If no direct child is lintable, it will ascend to the nearest ancestor domain containing a lintable file.
   - **Global Configuration Diagnostics**: If no lintable file exists in the domain hierarchy, or if the defect is a global configuration error, it will be anchored to `fafconfig.ts` (which is included in `configs.recommended.files`).
2. **Partial Linting Limitation**:
   - Because ESLint only displays diagnostics for files included in its current invocation, linting a subset of files (e.g., a single file opened in an editor) may not surface architectural diagnostics anchored to unlinted files.
   - Comprehensive architectural conformity requires linting the entire project (e.g., `npx eslint .` or CI runs).
3. **Missing configuration file**:
   - When discovery does not find `fafconfig.ts`, there is no configuration file that can receive the global fallback.
   - The rule reports `configuration/missing-config-file` on every file ESLint is linting. That is the only visible and deterministic anchor.

### Rationale

Architectural invariants are global properties of the codebase. Anchoring to a deterministic, predictable file ensures diagnostics consistently appear where developers can act on them, with `fafconfig.ts` as the ultimate fallback. Documenting the partial linting limitation sets clear expectations for editor integrations versus full CI verification.

### Observable Consequences

- A missing `index.ts` in a Fragment will be reported on the Fragment's Master node.
- Global configuration errors will be reported on `fafconfig.ts`.
- A missing `fafconfig.ts` is reported on every linted file as `configuration/missing-config-file`.
- Running ESLint over the entire project guarantees 100% visibility of all architectural diagnostics.

### Normative References

- `FAF.md`: §1.2, §6.1.1, §6.3, §6.8.

---

## D-11: Incompatibility with `eslint --cache`

### Context

ESLint provides a `--cache` flag to accelerate linting by skipping files whose content and mtime have not changed since the previous run.

### Decision

1. **Documented Incompatibility**: The plugin explicitly documents that `eslint --cache` is incompatible with `faf/conformity`. Users and CI workflows must not use `--cache`.
2. **Internal Dependency Cache**: The plugin will maintain its own internal, sound caching mechanisms (memoizing Module Records and project graphs, and invalidating based on directory fingerprinting, `package.json`, and `fafconfig.ts`), providing high performance without risking false passes.

### Rationale

ESLint's native `--cache` evaluates each file in complete isolation. If file B changes its exports or moves to another directory, file A (which imports file B) may not have changed on disk. Under `eslint --cache`, ESLint would skip file A, missing newly introduced cross-file architectural violations. Because FAF rules enforce whole-graph invariants, native per-file caching is fundamentally unsound.

### Observable Consequences

- Running ESLint without `--cache` produces accurate, deterministic architectural verification.
- The plugin's internal cache will ensure subsequent verification runs complete within performance budgets without skipping dependent checks.

### Normative References

- `FAF.md`: §1.2, §5.

---

## D-12: Diagnostic-Only Paradigm — Prohibition of Autofix and Automated Refactoring

### Context

ESLint provides an autofix mechanism (`context.report({ fix })`). Some linters attempt to automatically resolve issues or reorder code.

### Decision

The plugin is strictly **diagnostic-only**:

- It provides **zero automated fixes** (`fix` functions) and zero automated refactorings.
- It will never automatically move files, create directories, rewrite imports, or generate barrel files.

### Rationale

Architectural corrections require intentional engineering judgment:

- Deciding whether a private helper should be moved into a Private Category, extracted into a Sub-Fragment, or promoted to a Fractal Branch requires domain understanding that automated tools cannot possess.
- Automatically generating barrel files or moving files based on heuristics would violate FAF principles (e.g., avoiding artificial barrels, preserving strict master/access separation).
- Keeping the plugin purely diagnostic ensures it remains a trusted, non-destructive verification tool.

### Observable Consequences

- Running `eslint --fix` leaves all FAF diagnostics intact without mutating source files or directory structures.
- Developers retain full control over architectural refactoring decisions.

### Normative References

- `FAF.md`: §1.1, §1.2, §8.3.

---

## Vocabulary of Diagnostic Constraints

### Context

Diagnostic outcomes in `eslint-plugin-faf` are structured objects bearing a specific `constraint` identifier. Each constraint belongs to one of the six outcome families (`configuration`, `classification`, `symbol`, `dependency`, `acyclicity`, `unverified`). For predictable static analysis, every identifier must be unique, unambiguous, and formatted as `<family>/<kebab-case>`.

### Decision

The table below defines the authoritative vocabulary of diagnostic constraints for `eslint-plugin-faf`. It records all constraints currently produced by the codebase in `src/` alongside those established by `DECISIONS.md` (`D-01` through `D-12`) for future implementation phases.

| Constraint Identifier                           | Family           | Status      | Reference                 | Description                                                                                                       |
| ----------------------------------------------- | ---------------- | ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `configuration/commonjs-package-type`           | `configuration`  | Implemented | D-09, CONFIG_1            | Nearest `package.json` declares `"type": "commonjs"`, which is incompatible with native TypeScript type stripping |
| `configuration/config-load-failure`             | `configuration`  | Implemented | D-09, CONFIG_1            | Worker terminated unexpectedly or raised an unclassified runtime error during `fafconfig.ts` evaluation           |
| `configuration/conflicting-origin-kind`         | `configuration`  | Implemented | D-06, CONFIG_5            | The same origin path is declared as both a Root Layer and a Root Fragment                                         |
| `configuration/duplicate-origin`                | `configuration`  | Implemented | D-06, CONFIG_5            | The same origin path is declared more than once with an identical origin kind                                     |
| `configuration/invalid-default-export-function` | `configuration`  | Implemented | D-09, CONFIG_1            | The default export of `fafconfig.ts` is a function instead of a configuration object                              |
| `configuration/invalid-default-export-promise`  | `configuration`  | Implemented | D-09, CONFIG_1            | The default export of `fafconfig.ts` is a Promise/thenable instead of a synchronous configuration object          |
| `configuration/invalid-foreign-pattern`         | `configuration`  | Future      | D-05, CONFIG_6            | Glob pattern in `foreignFamilies` violates the allowed deterministic pattern grammar                              |
| `configuration/invalid-literal-path`            | `configuration`  | Future      | D-05, CONFIG_6, CONFIG_10 | Configuration path contains backslashes, empty segments, or illegal dot segments                                  |
| `configuration/invalid-naming-syntax`           | `configuration`  | Future      | D-05, CONFIG_6, CONFIG_10 | Declared identifier in `fafconfig.ts` (e.g. role name) violates plugin kebab-case naming grammar                  |
| `configuration/invalid-origin`                  | `configuration`  | Implemented | D-06, FAF §6              | Declared tree origin exists but is not a directory (even after symlink resolution)                                |
| `configuration/invalid-package-json`            | `configuration`  | Implemented | D-09, CONFIG_1            | `package.json` is not a regular file, is not valid JSON, or does not contain a JSON object                        |
| `configuration/missing-config-file`             | `configuration`  | Implemented | D-09, CONFIG_1            | `fafconfig.ts` was not found at explicit path or in directory traversal upwards towards root                      |
| `configuration/missing-default-export`          | `configuration`  | Implemented | D-09, CONFIG_1            | `fafconfig.ts` module does not provide an `export default` declaration                                            |
| `configuration/missing-origin`                  | `configuration`  | Implemented | D-06, FAF §6              | Declared tree origin directory does not exist on disk                                                             |
| `configuration/missing-roles`                   | `configuration`  | Implemented | D-02, CONFIG_5            | Roles catalog is absent in both local and common configuration blocks                                             |
| `configuration/overlapping-origins`             | `configuration`  | Implemented | D-06, CONFIG_5            | Declared tree origin is nested inside or overlaps another declared origin path                                    |
| `configuration/unclonable-config-value`         | `configuration`  | Implemented | D-09, CONFIG_1            | Configuration default export value failed structured cloning across the worker thread                             |
| `configuration/unresolved-relative-import`      | `configuration`  | Implemented | D-09, CONFIG_1            | Relative import inside `fafconfig.ts` lacks an explicit file extension                                            |
| `configuration/unsupported-typescript-syntax`   | `configuration`  | Implemented | D-09, CONFIG_1            | Non-strippable TypeScript syntax (`enum`, runtime `namespace`, class parameter property) used in config           |
| `classification/containment-matrix`             | `classification` | Future      | D-02, FAF §6.8            | Directory or file placed in invalid structural parent according to containment matrix                             |
| `classification/invalid-nomenclature`           | `classification` | Future      | D-05, FAF §4, §6.6        | Filesystem file, directory, or Fragment name deviates from plugin kebab-case grammar                              |
| `symbol/symbol-uniqueness`                      | `symbol`         | Future      | D-02, FAF §5, §6.1.1      | Root-scope symbol count exceeds limit or non-exempt file exports multiple symbols                                 |
| `dependency/peer-separation`                    | `dependency`     | Future      | D-02, FAF §5              | Unauthorized import between sibling fragments or across unpermitted boundaries                                    |
| `acyclicity/inter-tree-cycle`                   | `acyclicity`     | Future      | D-04, FAF §7.2            | Circular dependency physically formed by actual imports between two or more Fractal Trees                         |
| `acyclicity/root-dependency-cycle`              | `acyclicity`     | Future      | D-04, FAF §6.2.2, §7.2    | Circular dependency physically formed by actual imports between Root Nodes of distinct Root Fragments             |
| `unverified/config-loading-timeout`             | `unverified`     | Implemented | D-09, CONFIG_1            | Configuration worker execution exceeded synchronous timeout budget (default 30,000ms)                             |
| `unverified/cyclic-root-authorization`          | `unverified`     | Future      | D-04, FAF §6.2.2, §7.2    | Reciprocal dependency authorizations configured between Root Fragments without physical code cycle                |
| `unverified/cyclic-tree-authorization`          | `unverified`     | Future      | D-04, FAF §7.2            | Reciprocal dependency authorizations configured between separate Trees without physical code cycle                |
| `unverified/missing-data`                       | `unverified`     | Future      | D-03, FAF §1.2            | Verification check cannot be completed due to missing declaration context or data                                 |
| `unverified/non-literal-dynamic-import`         | `unverified`     | Future      | D-03, D-07, FAF §4, §5    | Dynamic `import()` call using a non-literal expression that cannot be statically resolved                         |
| `unverified/symbolic-link`                      | `unverified`     | Implemented | D-06, FAF §6              | Symbolic link within tree origin creates ambiguous physical identity; link is not traversed                       |
| `unverified/unreadable-entry`                   | `unverified`     | Implemented | D-06, FAF §6              | Filesystem entry or subdirectory within tree cannot be read or inspected                                          |
| `unverified/unreadable-external-file`           | `unverified`     | Future      | D-03, FAF §7.3            | External local file reached during graph traversal cannot be read or parsed                                       |
| `unverified/unreadable-origin`                  | `unverified`     | Implemented | D-06, FAF §6              | Declared tree origin directory exists but cannot be accessed due to I/O permissions or OS errors                  |
| `unverified/unresolved-import`                  | `unverified`     | Future      | D-03, D-08, FAF §5, §7.3  | Module specifier could not be resolved to a known codebase file or external package                               |
| `unverified/unsupported-file-type`              | `unverified`     | Future      | D-07, FAF §4, §6.7        | Imported file has an extension or format with no available parser or extractor                                    |
| `unverified/unsupported-syntax`                 | `unverified`     | Future      | D-07, FAF §4, §5          | Source file contains unsupported language syntax that prevents reliable static analysis                           |

---

## D-13: Zod v4 for untyped format boundaries

### Context

The format validator, `package.json#imports` parsing, and the load-config worker message were hand-written guards. Those checks repeat closed-object, type, null, explicit-undefined, and non-empty constraints that Zod v4 already implements, and they reported a property path for every failure.

### Decision

Zod v4 is a runtime dependency for those three boundaries only. Schemas use `strictObject` (no coercion). `TFAFLocalConfig` is one object with an explicit origin check, not `z.union`, so failures are not nested `invalid_union` issues. Semantic rules (repetitions, catalog invariants, implicit extensions, scopes, literal paths, foreign patterns) stay project functions. Zod issues are translated to the existing `configuration` outcomes: `constraint`, `propertyPath`, `element`, `normativeReference`, and family are unchanged. `TFAFConfig` stays hand-written, with JSDoc, and `test/types` checks that `z.output` of the format schema and `TFAFConfig` are mutually assignable with and without `exactOptionalPropertyTypes`. The Module Record cache is not validated with Zod until a warm-cache measurement against the 300 ms budget is reviewed. `zod` is an external package dependency, not bundled.

### Rationale

A schema library removes duplicated shape guards and keeps the property path of each failure. Keeping the public type hand-written preserves the published JSDoc. Leaving the cache unchanged avoids spending the warm budget before the measurement exists.

### Observable Consequences

- `zod` is declared in `dependencies` and left external by the bundler.
- Invalid configuration, imports, and worker messages still produce the same constraint, property path, and normative reference as before this decision.
- A type divergence between the schema output and `TFAFConfig` fails `test/types`.

### Normative References

- `FAF.md` format contract: closed objects, no coercion, required and admitted properties, value types, optional empty arrays versus required non-empty selectors, order-independent sets, hierarchies without repetition.
