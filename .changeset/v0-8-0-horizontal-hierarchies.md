---
'@morriconeluca/eslint-plugin-faf': minor
---

Redesign Horizontal Hierarchy declarations in `faf.config.ts` (`TFAFConfig`) to align with the FAF specification (`FAF §4`, `§6.3.4`, `§6.4.2`):

- **Tree-wide `subCategoryHierarchies`** (`common` or `locals`, `readonly TFAFDomainHierarchy[]`): Replaces tree-wide `horizontalHierarchies` exclusively for Sub-Categories, requiring at least two non-empty Rank tiers (`configuration/insufficient-hierarchy-tiers`), underscore-prefixed `kebab-case` names (`configuration/invalid-sub-category-name`), and disjunction from every Category name in the `roles` catalog (`configuration/sub-category-hierarchy-category-conflict`). Instantiates solely on `Category` (including Private Categories) and `Sub-Category` parents for direct-child `Sub-Category` domains.
- **Domain-scoped `horizontalHierarchies`** (`locals` only, `readonly TFAFHorizontalHierarchy[]` as `{ path, hierarchy }`): Replaces `localHorizontalHierarchies` (`configuration/unknown-property`), targeting a single parent Logical Domain `path` (`configuration/scope-mismatch` in `common`) with at least two non-empty Rank tiers where every declared member must physically exist as a direct child of `path` (`configuration/non-existent-path`).
- **Exported TypeScript Types**: Export `TFAFDomainHierarchy` and `TFAFHorizontalHierarchy`, retain `TFAFHierarchy` for `TFAFRootFragment['rootNodes']`, and remove `TFAFLocalHorizontalHierarchy`.
