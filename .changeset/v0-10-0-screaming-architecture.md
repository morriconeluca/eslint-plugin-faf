---
'@morriconeluca/eslint-plugin-faf': minor
---

Refactor internal plugin architecture to a zero-domain-hierarchy FAF Screaming Architecture:

- Introduce the `stage` Role (`_stages`) co-ranked at top Rank alongside `norm`, `rule`, and `store`, removing obsolete `service` and `adapter` Roles and eliminating all domain-level `horizontalHierarchies` and `horizontalHierarchyModels` from self-hosting `faf.config.ts`.
- Dissolve procedural umbrella wrappers (`verify-project` and `prepare-project`) so `conformity` directly coordinates `_stores/session`, the 11 pipeline `_stages`, and all 23 FAF `_norms`.
- Replace polymorphic `createOutcome` overloading with family-specific typed constructors, adopt declarative Zod schemas across untyped external boundaries, contract disproportionate micro-Fragments into Fragment Nodes, and align codebase nomenclature strictly with `FAF.md`.
