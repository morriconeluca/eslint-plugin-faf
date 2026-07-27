# eslint-plugin-faf

An ESLint plugin to deterministically enforce the rules and constraints of the **[Fractal Architecture Framework (FAF)](https://github.com/morriconeluca/fractal-architecture-framework)**.

This plugin is designed for complex TypeScript/JavaScript codebases to ensure **predictability**, **testability**, and strict **isolation** of dependency flows. It is fully compatible with modern ESLint flat configurations (ESLint v9 and v10).

---

## Features

- **Strict Enforcing of FAF Taxonomy**: Ensures your folder structure strictly maps to Layers, Categories, Fragments, and Fractal Branches.
- **Law of Separation between Peers**: Prevents lateral dependency coupling between sibling modules without explicit hierarchy.
- **Access Node Encapsulation**: Guarantees that internal Fragment files are never imported directly, enforcing consumption solely through the Fragment's barrel file (`index.ts`).
- **High-Performance Architecture**: Features optimized caching (`dirCache`, `classifyCache`, `rolesCache`) to minimize disk I/O during linting runs.

---

## Installation

Install the plugin along with its peer dependencies:

```bash
npm install eslint-plugin-faf --save-dev
# or
yarn add eslint-plugin-faf --dev
# or
pnpm add eslint-plugin-faf -D
```

---

## Configuration

`eslint-plugin-faf` is configured via the ESLint flat config file (`eslint.config.ts` or `eslint.config.js`). All architectural settings are loaded from the global `settings.faf` object.

### 1. Integration in `eslint.config.ts`

For a clean setup, we recommend defining your FAF taxonomy settings in a separate file (e.g. `faf.config.ts`) and importing it into your ESLint configuration.

Since FAF is an **all-or-nothing architectural system**, all rules must be active as blocking errors to prevent architectural drift. The canonical way to integrate it is by extending `fafPlugin.configs.recommended` (which pre-configures all rules as `"error"`) and injecting your settings:

```typescript
import fafPlugin from 'eslint-plugin-faf';
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
            paths: ['src/_src@shared/_network/_apis'],
            role: 'api',
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

**Single Source of Truth**: By default, `eslint-plugin-faf` automatically resolves your path aliases using the `"imports"` field in your `package.json`. If `"imports"` contains any keys, it is treated as the exclusive source of truth, and any `aliases` configured in `faf.config.ts` will be ignored. If `"imports"` is not defined or empty, the plugin falls back to using the `aliases` object defined in `faf.config.ts`.

### `excludes`

Array of path strings relative to the project root. Any folder matching these paths (or their subfolders) will be completely ignored by the linter.

### `categories`

Configures taxomonic categories (`_` prefixed directories).

- `role`: Maps the folder to an architectural role. It removes language plural heuristics (e.g., mapping `_components` to the `component` role suffix).
- `allowSingleFiles`: Set to `true` to allow single files (`Logical Nodes`) directly in the category. If `false` or omitted, only subfolder `Fragments` are permitted.
- `allowedExtensions`: Whitelists file extensions for asset categories. Matches are treated as static assets, skipping role suffix validation (e.g. `logo.png` inside `_images`).

### `localHorizontalHierarchies` / `globalHorizontalHierarchies`

Determines horizontal import flow (Peer Separation). Each hierarchy is an array of string arrays.

- Sub-folders at index `i` can import from sub-folders at index `j` only if `j < i`.
- Peer folders at the same index (e.g. `['_network', '_state', '_ui']`) cannot import from each other.

---

## Rules Reference

### 1. `faf/naming-conventions`

Verifies folders, files, and roles comply with FAF taxonomy:

- Enforces `kebab-case` naming for all folders and files in the logical domain.
- Validates that internal Fragment files share their parent Fragment's name prefix (e.g. files in folder `button/` must be named `button.<role>.<ext>`).
- Enforces role suffix validation on Fragment Nodes and Logical Nodes.
- Assures route terminal Fragments contain the appropriate Master Node (e.g. a `.api.ts` file under `_apis`).

### 2. `faf/enforce-access-node`

Enforces Access Node (`index.ts` / `index.js`) integrity:

- Restricts the Access Node to import/export only its own sibling Fragment Nodes.
- Prevents import of nested Private Categories, Fractal Branches, or unrelated external paths.

### 3. `faf/no-direct-fragment-import`

Applies **Fragment Encapsulation**:

- Prevents external files from directly importing a Fragment's internal files. All imports must pass through the Fragment's Access Node (`index.ts`).

### 4. `faf/no-private-category-leak`

Applies **Private Category Encapsulation**:

- Restricts consumption of elements inside a Private Category (e.g. `_components/` nested inside a Fragment) to files within the parent Fragment or its sub-fragments.

### 5. `faf/no-fractal-branch-leak`

Applies **Fractal Branch Encapsulation**:

- Fractal Branches named `_<Scope>@shared` are only importable by modules residing inside the parent Scope's subtree.

### 6. `faf/no-peer-dependency`

Applies **Peer Isolation**:

- Prevents sibling files and folders from importing each other unless an explicit hierarchy is configured:
  - **Inside a Fragment**: Flow is governed by the `roles` array order.
  - **Between folders**: Flow is governed by `localHorizontalHierarchies` or `globalHorizontalHierarchies`. If undefined, the linter falls back to mapped roles. Otherwise, peer isolation is strictly enforced.
  - **Root Nodes**: Flow is governed by the defined index order in `rootFragments.rootNodes`.

### 7. `faf/category-mutually-exclusive`

Ensures category purity:

- Blocks mixing single files (Logical Nodes) and subfolders (Fragments) in the same category.
- Blocks direct file placement inside categories configured with `allowSingleFiles: false`.

---

## Performance Optimizations

To prevent sluggish linting in large codebases, the core engine implements heavy caching:

- **Directory Cache (`dirCache`)**: Inspects the physical disk exactly once per folder, storing the contents in-memory.
- **Classification Cache (`classifyCache`)**: Memoizes the structural type (`FolderType`) of each directory for the lifetime of the ESLint run.
- **Role Cache (`rolesCache`)**: Uses a `WeakMap` to cache the flattened list of role names per tree configuration, avoiding memory leaks and redundant array allocations.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
