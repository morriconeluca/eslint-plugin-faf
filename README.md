# @morriconeluca/eslint-plugin-faf

An ESLint plugin to deterministically enforce the rules and constraints of the **[Fractal Architecture Framework (FAF)](https://github.com/morriconeluca/fractal-architecture-framework)**.

This plugin is designed for complex TypeScript/JavaScript codebases to ensure **predictability**, **testability**, and strict **isolation** of dependency flows. It is fully compatible with modern ESLint flat configurations (ESLint v9 and v10).

---

## Features

- **Strict Enforcing of FAF Taxonomy**: Ensures your folder structure strictly maps to Layers, Categories, Fragments, and Fractal Branches.
- **Law of Separation between Peers**: Prevents lateral dependency coupling between sibling modules without explicit hierarchy.
- **Access Node Encapsulation**: Guarantees that internal Fragment files are never imported directly, enforcing consumption solely through the Fragment's barrel file (`index.ts`).
- **High-Performance Architecture**: Features optimized caching (`dirCache`, `classifyCache`, `rolesCache`) to minimize disk I/O during linting runs.

---

## Companion Tooling

`eslint-plugin-faf` does not detect dependency cycles. FAF requires the dependency graph to be a Directed Acyclic Graph, but enforcing that is intentionally left to dedicated tools, configured separately in your project:

- [`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x)'s `import-x/no-cycle` rule.
- [`dependency-cruiser`](https://github.com/sverweij/dependency-cruiser), for cycle detection and other custom dependency fitness functions.

---

## Installation

Install the plugin along with its peer dependencies:

```bash
npm install @morriconeluca/eslint-plugin-faf --save-dev
# or
yarn add @morriconeluca/eslint-plugin-faf --dev
# or
pnpm add @morriconeluca/eslint-plugin-faf -D
```

---

## Configuration

`@morriconeluca/eslint-plugin-faf` is configured via the ESLint flat config file (`eslint.config.ts` or `eslint.config.js`). All architectural settings are loaded from the global `settings.faf` object.

### 1. Integration in `eslint.config.ts`

For a clean setup, we recommend defining your FAF taxonomy settings in a separate file (e.g. `faf.config.ts`) and importing it into your ESLint configuration.

Since FAF is an **all-or-nothing architectural system**, all rules must be active as blocking errors to prevent architectural drift. The canonical way to integrate it is by extending `fafPlugin.configs.recommended` (which pre-configures all rules as `"error"`) and injecting your settings:

```typescript
import fafPlugin from '@morriconeluca/eslint-plugin-faf';
import fafSettings from './faf.config';

export default [
  // 1. Extend the recommended FAF configuration (registers the plugin and enables all rules as errors)
  fafPlugin.configs.recommended,

  // 2. Inject FAF taxonomy settings
  {
    files: ['**/*.{js,cjs,ts,cts,tsx}'],
    settings: {
      ...fafSettings,
    },
  },
];
```

---

## Anatomy of `faf.config.ts`

Here is a comprehensive configuration example mapping a typical project structure:

```typescript
export default {
  faf: {
    // 1. Path aliases mapping (resolves absolute imports)
    aliases: {
      '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
      '#/_app@shared': 'src/app/_app@shared',
      '#/_src@shared': 'src/_src@shared',
    },

    // 2. Tree configurations
    trees: [
      {
        // Root path to apply these rules to
        includes: ['src'],

        // Paths to completely exclude from FAF validation (Foreign Domains)
        excludes: ['src/configs'],

        // Definition of organizational Categories (folders starting with "_")
        categories: [
          // name: Name of the folder
          // role: Associated architectural role
          // allowSingleFiles: Allow files (Logical Nodes) directly in the folder (defaults to false)
          // allowedExtensions: Limit file types for static assets (disables role suffix check)
          { name: '_apis', role: 'api' },
          { name: '_components', role: 'component' },
          { name: '_utils', role: 'util' },
          { name: '_hooks', role: 'hook' },
          { name: '_layouts', role: 'layout' },
          { name: '_pages', role: 'page' },
          { name: '_routes', role: 'route' },
          { name: '_recipes', role: 'recipe' },
          { name: '_classes', role: 'class' },
          { name: '_contexts', role: 'context' },
          { name: '_stores', role: 'store' },
          { name: '_factories', role: 'factory' },
          { name: '_instances', role: 'instance' },
          { name: '_boundaries', role: 'boundary' },

          // Categories that allow direct logical files (Logical Nodes)
          { allowSingleFiles: true, name: '_constants', role: 'constant' },
          { allowSingleFiles: true, name: '_types', role: 'type' },
          { allowSingleFiles: true, name: '_schemas', role: 'schema' },
          { allowSingleFiles: true, name: '_mocks', role: 'mock' },

          // Asset-only categories (no logical role required)
          { allowedExtensions: ['.css'], name: '_styles' },
          { allowedExtensions: ['.ttf', '.woff', '.woff2'], name: '_fonts' },
          {
            allowedExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
            name: '_images',
          },
        ],

        // Global horizontal hierarchies: flow rules for peer imports
        globalHorizontalHierarchies: [
          [
            ['_atoms'],
            ['_molecules'],
            ['_organisms'],
            ['_templates'],
            ['_pages'],
          ],
          [
            ['_primitives'],
            ['_compounds'],
            ['_aggregates'],
            ['_systems'],
            ['_ecosystems'],
          ],
        ],

        // Local horizontal hierarchies: flow rules restricted to specific paths
        // Imports flow from left to right (elements on the right can import from the left)
        localHorizontalHierarchies: [
          {
            hierarchies: [['_domain'], ['_network', '_state', '_ui']],
            paths: ['src/_src@shared'],
          },
          {
            hierarchies: [['_enums'], ['_dtos']],
            paths: ['src/_src@shared/_domain/_schemas'],
          },
          {
            hierarchies: [['_types'], ['_classes'], ['_utils'], ['_apis']],
            paths: ['src/_src@shared/_network'],
          },
          {
            hierarchies: [
              ['_constants'],
              ['_types'],
              ['_utils'],
              ['_recipes'],
              ['_components'],
              ['_pages'],
            ],
            paths: ['src/_src@shared/_ui'],
          },
        ],

        // Suffix hierarchy role scale for files inside a Fragment.
        // Files with roles at higher indices can import from roles at lower indices.
        roles: [
          ['constant'],
          ['schema'],
          ['type'],
          ['class'],
          ['config'],
          ['mock'],
          ['util'],
          ['style'],
          ['recipe'],
          ['factory'],
          ['instance'],
          ['hook'],
          [
            'api',
            'boundary',
            'component',
            'context',
            'layout',
            'page',
            'route',
            'store',
          ],
          ['index', 'spec', 'story'],
        ],

        // Software entry points (Root Fragments) and their dependency rules
        rootFragments: [
          {
            paths: ['src'],
            // rootNodes specifies permitted layers of execution:
            // main.tsx (index 1) can import main.css and app/app.tsx (index 0), but not vice-versa
            rootNodes: [['main.css', 'app/app.tsx'], ['main.tsx']],
            subRootFragments: [
              {
                paths: ['src/app'],
                rootNodes: [['app.tsx']],
              },
            ],
          },
        ],

        // Route-based structure (HTTP APIs or Pages)
        routeHierarchies: [
          {
            // Subtree where intermediate folders are classified as organizational Layers,
            // and the terminal Fragment must contain a Master Node with the specified role (e.g. '.api.ts')
            // and a name following the "<method>-<object>" pattern (e.g. 'get-todo')
            paths: ['src/_src@shared/_network/_apis'],
            role: 'api',
            // Optional: restricts which HTTP methods are valid as the Fragment name prefix.
            // Defaults to all standard HTTP methods (get, post, put, patch, delete, head, options, connect, trace).
            httpMethods: ['get', 'post', 'put', 'patch', 'delete'],
          },
        ],
      },
    ],
  },
};
```

---

## Configuration Settings Reference

### `aliases`

Maps import aliases (e.g., `#/_src@shared`) to relative paths from the project root. This is critical for the linter to trace boundaries and verify import encapsulation.

**Single Source of Truth**: By default, `eslint-plugin-faf` automatically resolves your path aliases using the `"imports"` field in your `package.json`. If `"imports"` contains any keys mapped to flat path strings, it is treated as the exclusive source of truth, and any `aliases` configured in `faf.config.ts` will be ignored. If `"imports"` is not defined, empty, or consists only of conditional import objects (which are skipped by the linter for simplicity), the plugin falls back to using the `aliases` object defined in `faf.config.ts`.

_Note: If your codebase uses conditional imports in `package.json` (e.g. mapping aliases to objects for ESM/CJS or types/default targets), you must define their flat equivalents in `faf.config.ts` `aliases` to ensure correct linting._

### `excludes`

Array of path strings relative to the project root. Any folder matching these paths (or their subfolders) will be completely ignored by the linter.

### `categories`

Configures taxomonic categories (`_` prefixed directories).

- `role`: Maps the folder to an architectural role. It removes language plural heuristics (e.g., mapping `_components` to the `component` role suffix).
- `allowSingleFiles`: Set to `true` to allow single files (`Logical Nodes`) directly in the category. If `false` or omitted, only subfolder `Fragments` are permitted, except for static assets matching the `allowedExtensions` whitelist.
- `allowedExtensions`: Whitelists file extensions for asset categories. Matches are treated as static assets, skipping role suffix validation (e.g. `logo.png` inside `_images`).

### `localHorizontalHierarchies` / `globalHorizontalHierarchies`

Determines horizontal import flow (Peer Separation). Each hierarchy is an array of string arrays.

- Sub-folders at index `i` can import from sub-folders at index `j` only if `j < i`.
- Peer folders at the same index (e.g. `['_network', '_state', '_ui']`) cannot import from each other.

---

## Rules Reference

### 1. `faf/naming-conventions`

Verifies pure lexical FAF naming conventions:

- Enforces `kebab-case` naming for all folders and files in the logical domain.
- Requires an underscore prefix for Layers/Categories/Sub-Categories, and forbids it for Fragments/Sub-Fragments/Root Fragments.
- Validates that a Fractal Branch's name matches its parent scope (`_<Scope>@shared`).
- Restricts a Logical Node's name to a single Role segment, whether it is a Fragment Node or a loose file inside a Category.
- For loose files inside a Category: validates the file extension against the category's whitelist, requires a role suffix on code files, and validates that the role matches the Category's configured role.

### 2. `faf/logical-domain-placement`

Enforces FAF topological placement constraints between Logical Domains:

- Root Fragments can only reside directly in the Root Container or another Root Fragment.
- Layers cannot reside inside Fragments, and cannot contain files or Fragments directly, except the terminal Layer of a configured Route Hierarchy.
- Fragments cannot be placed directly inside other Fragments (they must be nested within a Private Category), Layers (unless terminating a Route Hierarchy), Fractal Branches, or nested Root Fragments.
- Fractal Branches cannot be nested inside other Fractal Branches, and cannot contain files directly.

### 3. `faf/enforce-access-node`

Enforces Access Node (`index.ts` / `index.js`) integrity:

- Requires a directory that isn't a Category, Layer, Fractal Branch, or Root Fragment to have an Access Node.
- Restricts Access Nodes to Fragments: an index file directly inside any other Logical Domain is forbidden.
- Requires every Fragment to contain at least one Fragment Node (its Master Node).
- Restricts the Access Node to import/export only its own sibling Fragment Nodes.
- Prevents import of nested Private Categories, Fractal Branches, or unrelated external paths.

### 4. `faf/fragment-master-node`

Enforces Fragment Node identity and Master Node integrity:

- Validates that internal Fragment files share their parent Fragment's name prefix (e.g. files in folder `button/` must be named `button.<role>.<ext>`).
- Requires a role suffix on every Fragment Node, and forbids two Fragment Nodes from sharing the same Role.
- Assures a Fragment placed under a Category (or terminating a Route Hierarchy) contains a Master Node carrying the Role imposed by that Category/Route (e.g. a `.api.ts` file under `_apis`).
- Assures route terminal Fragments follow the `<method>-<object>` naming pattern (e.g. `get-todo`), with the HTTP method restricted to `routeHierarchies[].httpMethods` or, by default, all standard HTTP methods.

### 5. `faf/no-direct-fragment-import`

Applies **Fragment Encapsulation**:

- Prevents external files from directly importing a Fragment's internal files. All imports must pass through the Fragment's Access Node (`index.ts`).

### 6. `faf/no-private-category-leak`

Applies **Private Category Encapsulation**:

- Restricts consumption of elements inside a Private Category (e.g. `_components/` nested inside a Fragment) to the direct child Fragment Nodes of the owning Fragment/Root Fragment, and to sibling nodes within the same immediate sub-domain of the Private Category. Access does not extend to other sub-domains, nor to a Fractal Branch nested inside the Private Category (governed instead by its own encapsulation rule).

### 7. `faf/no-fractal-branch-leak`

Applies **Fractal Branch Encapsulation**:

- Fractal Branches named `_<Scope>@shared` are only importable by modules residing inside the parent Scope's subtree.
- A Fractal Branch itself must never depend, not even indirectly, on the subtree it serves: importing anything from its owner's subtree that isn't part of the branch itself is forbidden.

### 8. `faf/no-peer-dependency`

Applies **Peer Isolation** via horizontal hierarchy resolution:

- **Inside a Fragment**: Flow is governed by the `roles` array order.
- **Between folders**: Flow is governed exclusively by `localHorizontalHierarchies` or `globalHorizontalHierarchies`; a sibling pair without a matching entry is denied in both directions.

Foreign Domain imports and Root Node dependency direction are handled by dedicated rules (see below).

### 9. `faf/foreign-domain-isolation`

Applies **Foreign Domain isolation**:

- Prevents Logical Nodes from importing a file from a Foreign Domain (e.g. `src/configs`).
- Prevents a Foreign Domain file from importing a Logical Node from the FAF tree.

### 10. `faf/root-node-dependency-direction`

Enforces explicit, non-Role-based dependency direction between **Root Nodes**:

- Flow is governed exclusively by the defined index order in `rootFragments.rootNodes`. Root Nodes are exempt from the Role naming convention, so relationships between them (sibling or nested Root Fragments) never fall back to the `roles` scale: any relationship without a matching `rootNodes` entry is denied.

### 11. `faf/category-mutually-exclusive`

Ensures category purity:

- Blocks mixing single files (Logical Nodes) and subfolders (Fragments) in the same category.
- Blocks direct file placement inside categories configured with `allowSingleFiles: false`.

---

## Migrating from 7 rules to 11

Starting with this release, five checks that used to live inside two large rules (`naming-conventions` and `no-peer-dependency`) have moved to dedicated rules with their own `id`. The underlying checks and their error messages are unchanged — only the `ruleId` reporting them is different. This is a breaking change for anyone who doesn't use `configs.recommended` (which picks up the new rules automatically) or who references a specific rule `id` directly, e.g. in `// eslint-disable-next-line faf/<id>` comments or a hand-written `rules` block.

| Old rule id                                                                                                                          | Check moved to                           |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `naming-conventions` — folder/file placement (Root Fragment, Layer, Fragment, Fractal Branch containment)                            | `logical-domain-placement` (new)         |
| `naming-conventions` — Access Node existence, Master Node existence                                                                  | `enforce-access-node`                    |
| `naming-conventions` — Fragment Node name prefix, role requirement/uniqueness, Category/Route Master Node role, route naming pattern | `fragment-master-node` (new)             |
| `naming-conventions` — kebab-case, underscore prefix, Fractal Branch naming, single-Role-segment, Category loose-file naming         | unchanged, stays in `naming-conventions` |
| `no-peer-dependency` — Foreign Domain imports (both directions)                                                                      | `foreign-domain-isolation` (new)         |
| `no-peer-dependency` — Root Node dependency direction (`rootFragments.rootNodes`)                                                    | `root-node-dependency-direction` (new)   |
| `no-peer-dependency` — horizontal hierarchy resolution (Fragment Node roles, sibling folders)                                        | unchanged, stays in `no-peer-dependency` |

`no-direct-fragment-import`, `no-private-category-leak`, `category-mutually-exclusive` are unaffected. `no-fractal-branch-leak` keeps its `id` and gains one new check: a Fractal Branch depending on the subtree it serves is now reported.

---

## Performance Optimizations

To prevent sluggish linting in large codebases, the core engine implements aggressive, state-cached optimizations:

- **Directory Cache (`dirCache`)**: Inspects the physical disk exactly once per folder, storing the contents in-memory. It is optimized to perform exactly one system call on cache misses by removing redundant `fs.existsSync` checks.
- **Classification Cache (`classifyCache`)**: Memoizes the structural type (`FolderType`) of each directory for the lifetime of the ESLint run.
- **Ancestor Chain Cache (`ancestorChainCache`)**: Memoizes the full chain of classified ancestors above a directory, so rules that walk upward from a file (folder taxonomy, topological placement) do so once per directory rather than once per file.
- **Role Cache (`rolesCache`)**: Uses a `WeakMap` to cache the allowed roles per tree configuration as a native `Set`, avoiding memory leaks, redundant array flattening allocations, and speeding up role lookup checks to $O(1)$.
- **Category Configuration Cache (`categoryConfigCache`)**: Memoizes resolved category configurations per folder path to eliminate repetitive directory walks and path parent traversals.
- **Tree Configuration Cache (`treeConfigCache` / `treeConfigIncludingExcludedCache`)**: Memoizes resolved tree configurations per file path, reducing tree lookup checks to a simple map-lookup.
- **Resolved Import Path Cache (`resolvedImportPathCache`)**: Caches project-root-relative resolved import paths to avoid repeating expensive path resolutions, alias matching, and package.json parsing on duplicate imports.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
