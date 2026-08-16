# eslint-plugin-faf

## 0.5.0

### Minor Changes

- 0c6c054: Split `naming-conventions` and `no-peer-dependency` — the two rules that had accumulated most of the plugin's checks — into eleven focused rules along their real semantic boundaries, and added one previously-missing check to `no-fractal-branch-leak`. Every moved check keeps its exact behavior and error message text; only the reporting `ruleId` changes.

  This is a breaking change for anyone not using `configs.recommended` (which picks up the new rules automatically), or referencing a specific rule `id` directly (e.g. `// eslint-disable-next-line faf/<id>`, or a hand-written `rules` block).

  **`naming-conventions`** is now restricted to pure lexical checks (kebab-case, underscore prefix rules, Fractal Branch naming, single-Role-segment, Category loose-file naming). Three checks moved out of it:

  - **`logical-domain-placement`** (new): Root Fragment/Layer/Fragment/Fractal Branch topological placement — where a domain is allowed to physically sit relative to its parent.
  - **`enforce-access-node`** (existing rule, absorbs two checks): Access Node existence for a directory that should have one, and "Fragment has no Master Node".
  - **`fragment-master-node`** (new): Fragment Node name prefix, role requirement/uniqueness within a Fragment, Category/Route-imposed Master Node role, and the route terminal `<method>-<object>` naming pattern.

  **`no-peer-dependency`** is now restricted to horizontal hierarchy resolution (same-directory Fragment Node Role order, sibling directory hierarchies). Two checks moved out of it:

  - **`foreign-domain-isolation`** (new): Imports between Logical Nodes and Foreign Domains, in both directions.
  - **`root-node-dependency-direction`** (new): Dependency direction between Root Nodes via `rootFragments.rootNodes`, with no fallback to the Role scale.

  **`no-fractal-branch-leak`** gains a new check: a Fractal Branch depending on the subtree it serves — even indirectly, even on something outside a Private Category — is now reported. This is the only genuinely new behavior in this change; everything else is a move.

  `no-direct-fragment-import`, `no-private-category-leak`, and `category-mutually-exclusive` are unaffected.

  Internally, the repeated ancestor-directory traversal used by folder taxonomy and placement checks is now a single cached utility (`walkAncestors`) shared across rules, instead of being re-walked and re-classified per file per rule.

## 0.4.0

### Minor Changes

- cc9dac3: Removed an implicit role-based fallback in `no-peer-dependency` that allowed sibling directories to import each other when no horizontal hierarchy was declared for that pair, as long as their mapped Roles happened to be in a compatible order.

  This fallback was not authorized by the Law of Separation between Peers: reusing the Role scale is something an architect may choose when declaring a horizontal hierarchy, not a default the linter should infer in its absence. Sibling directories now require an explicit `localHorizontalHierarchies`/`globalHorizontalHierarchies` entry to import from one another; without one, the import is denied in both directions.

  This may surface new violations in codebases that were relying on this fallback without an explicit hierarchy declaration.

## 0.3.0

### Minor Changes

- 6ae3826: Tightened encapsulation checks around Private Categories and Fragment roots, added Master Node and Role uniqueness validation to Fragments, and added HTTP method validation for route-based Fragments.

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

## 0.2.0

### Minor Changes

- ff85779: Refactored private category checks, added local domain utility helpers, and refined rule checks to improve rule precision.

  - **category-mutually-exclusive**: Skip reporting direct file node errors if the extension is disallowed, delegating the precise error to `naming-conventions`.
  - **no-fractal-branch-leak** & **no-private-category-leak**: Refine Private Category Leak checking to allow imports from within the same sub-domain under a private category or within authorized nested fractal branches.
  - **CI/CD**: Added a GitHub action release workflow using changesets.

## 0.1.1

### Patch Changes

- 2af8fc0: Refactor package entrypoint by decomposing `src/main.ts` into single-responsibility Root Nodes (`types.ts`, `rules.ts`, `configs.ts`, `main.ts`).
- 0ea809b: Refactor context utilities into individual fragments under systemic design directories, add strict nesting validation rules to `faf/naming-conventions`, and optimize linter caches.

## 0.1.0

### Minor Changes

- 91247b5: Initial release of the `eslint-plugin-faf` plugin, designed to enforce the Fractal Architecture Framework (FAF) guidelines:

  - Introduced the core FAF engine with high-performance caches (`dirCache`, `classifyCache`, `rolesCache`) for fast static analysis.
  - Introduced 7 rules to enforce FAF constraints:
    - `naming-conventions`: Enforces kebab-case folder structure, role suffix naming, and FAF taxonomy.
    - `enforce-access-node`: Restricts the barrel `index.ts` to export only its sibling Fragment Nodes.
    - `no-direct-fragment-import`: Prevents direct imports of Fragment internal files from the outside.
    - `no-private-category-leak`: Restricts access to Private Categories (e.g., nested `_components`).
    - `no-fractal-branch-leak`: Restricts access to Fractal Branches (e.g., `_src@shared`).
    - `no-peer-dependency`: Enforces sibling separation and horizontal/role import hierarchies.
    - `category-mutually-exclusive`: Enforces category purity (only Fragments or only Logical Nodes).
  - Fully compatible with modern ESLint flat configurations (v9 and v10) using `configs.recommended`.
  - Supports single-source-of-truth path aliases via `package.json` `"imports"`, with fallback to `faf.config.ts`.
