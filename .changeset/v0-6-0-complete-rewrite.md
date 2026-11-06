---
'@morriconeluca/eslint-plugin-faf': minor
---

# BREAKING CHANGES — Complete Rewrite (0.6.0)

Version `0.6.0` represents a complete ground-up rewrite of `@morriconeluca/eslint-plugin-faf` around the formal Fractal Architecture Framework (FAF) specification and the `fafconfig.ts` configuration contract. Nothing from version `0.5.x` is compatible.

### Major Changes

- **Single Unified Rule (`faf/conformity`)**: Replaced all legacy individual rules with a single zero-option, conjunctive architectural rule.
- **Dedicated Architectural Configuration (`fafconfig.ts`)**: Removed `settings.faf.trees` and `faf.config.ts`. Architectural blueprints are now authored in `fafconfig.ts` implementing `TFAFConfig` with synchronous isolated worker evaluation.
- **6 Uniform Diagnostic Families**: All diagnostics are blocking errors (`severity: 2`) categorized under `configuration`, `classification`, `symbol`, `dependency`, `acyclicity`, and `unverified`.
- **High-Performance Parsers & Resolvers**: Native AST parsing via `oxc-parser` for TypeScript/JavaScript, dedicated CSS scanner, terminal binary asset handling, and resolution environment alignment via `oxc-resolver`.
- **Sound In-Memory & Persistent Caching**: Replaced per-file caching (`eslint --cache` is unsupported) with deterministic whole-graph memoization and automatic cache invalidation based on filesystem fingerprinting.
