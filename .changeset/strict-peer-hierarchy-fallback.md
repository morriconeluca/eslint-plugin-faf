---
'@morriconeluca/eslint-plugin-faf': minor
---

Removed an implicit role-based fallback in `no-peer-dependency` that allowed sibling directories to import each other when no horizontal hierarchy was declared for that pair, as long as their mapped Roles happened to be in a compatible order.

This fallback was not authorized by the Law of Separation between Peers: reusing the Role scale is something an architect may choose when declaring a horizontal hierarchy, not a default the linter should infer in its absence. Sibling directories now require an explicit `localHorizontalHierarchies`/`globalHorizontalHierarchies` entry to import from one another; without one, the import is denied in both directions.

This may surface new violations in codebases that were relying on this fallback without an explicit hierarchy declaration.
