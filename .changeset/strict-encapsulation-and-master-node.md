---
'@morriconeluca/eslint-plugin-faf': minor
---

Tightened encapsulation checks around Private Categories and Fragment roots, added Master Node and Role uniqueness validation to Fragments, and added HTTP method validation for route-based Fragments.

- **no-private-category-leak**: A Fractal Branch nested inside a Private Category is now the sole authority over access to its own contents; a direct child of the Private Category's owner no longer bypasses it.
- **no-direct-fragment-import** & **no-peer-dependency**: A node nested inside a Private Category or Fractal Branch of a Fragment no longer has privileged access to that Fragment's own root files; only literal sibling Fragment Nodes are exempt from the Access Node requirement.
- **no-peer-dependency**: Relationships between Root Nodes no longer fall back to the Role hierarchy when unconfigured; they are denied unless explicitly authorized via `rootNodes`.
- **naming-conventions**:
  - Every Fragment must now contain at least one Fragment Node (its Master Node); an otherwise empty Fragment is reported.
  - Two Fragment Nodes can no longer share the same Role within the same Fragment.
  - A file named `index.ts`/`index.js` prescribed as a Root Node in `rootFragments` is no longer incorrectly flagged as a misplaced Access Node.
  - Route terminal Fragments must now follow the `<method>-<object>` naming pattern. The accepted HTTP methods are configurable per route hierarchy via the new `httpMethods` option (`TRouteHierarchyConfig`), and default to all standard HTTP methods.
- Fixed a non-deterministic import resolution when multiple files share the same name prefix (e.g. `foo.ts` and `foo.spec.ts`), which could previously resolve to the wrong file depending on filesystem read order.
- Documentation: corrected inaccurate rule descriptions and a broken code example in `CONTRIBUTING.md`, and documented that cycle detection is intentionally left to companion tooling (`eslint-plugin-import-x`, `dependency-cruiser`).
