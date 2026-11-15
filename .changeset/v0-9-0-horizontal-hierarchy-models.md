---
'@morriconeluca/eslint-plugin-faf': minor
---

Align Horizontal Hierarchy configuration properties, exported TypeScript types, and diagnostic constraint names with the exact concepts defined in the FAF specification (`FAF §4`, `§6.3.4`, `§6.4.2`):

- **Tree-wide `horizontalHierarchyModels`** (`common` or `locals`, `readonly TFAFHorizontalHierarchyModel[]`): Replaces the non-normative `subCategoryHierarchies` property (`configuration/unknown-property`) to declare tree-wide Horizontal Hierarchy models for Sub-Categories, reporting Category name collisions via `configuration/horizontal-hierarchy-model-category-conflict`.
- **Single-parent `horizontalHierarchies`** (`locals` only, `readonly TFAFHorizontalHierarchy[]`): Orders direct-child Logical Domains actually present under a single parent Logical Domain `path`.
- **Exported TypeScript Types**: Export `TFAFHorizontalHierarchyModel` and `TFAFHorizontalHierarchy`, removing `TFAFDomainHierarchy`.
