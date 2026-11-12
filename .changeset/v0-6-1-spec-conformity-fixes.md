---
'@morriconeluca/eslint-plugin-faf': patch
---

Align configuration validation, path alias resolution, external file discovery, mimetic naming, module analysis, and outcome diagnostics with the FAF specification:

- **External Subdirectory Discovery**: Recursively discover lintable local codebase files in external subdirectories outside all Fractal Trees so unauthorized imports into non-public Tree nodes (`dependency/tree-opacity`) and Foreign Nodes (`dependency/foreign-node-isolation`) are reliably detected.
- **Undeclared `tsconfig.json` Alias Discordance**: Detect imports resolved via `tsconfig.json` (`paths` / `baseUrl`) that are not declared in the official alias source (`common.aliases` or `package.json#imports`) and report `unverified/unresolved-import` discordance instead of bypassing `FAF §7.4` path alias anchoring.
- **Direct Alias & External Reference Validation**: Validate that `common.aliases` values identify existing directories without wildcards, reject platform-specific backslash separators in literal configuration paths, propagate effective alias prefixes into reference validation (`configuration/external-dependency-to-alias`), and report `configuration/expected-file` when `externalDependencies.to` targets an existing directory.
- **Mimetic Path Fragment Naming**: Enforce longest-prefix `<action>-<target>` decomposition when a Path Fragment name equals a composite action with an empty target, and resolve nested Mimetic Path Structures against their nearest Parent Category.
- **Script Module Analysis & CommonJS Boundaries**: Distinguish local type-only exports (`export type { X }`) from value imports sharing the same identifier, and report CommonJS export assignments (`module.exports` / `exports.*`) as `unverified/unsupported-syntax`.
- **Diagnostic Catalog & Documentation**: Align `OUTCOME_CATALOG` predicates and normative references (`FAF §4, §6.3.1`, `FAF §6.2`, `FAF §6.2.1`, `D-05`), forbid `.d.ts`/`.d.mts`/`.d.cts` in `implicitRoleExtensions`, and document the nominal `kebab-case` grammar in `README.md`.
