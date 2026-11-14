# @morriconeluca/eslint-plugin-faf

ESLint plugin that validates TypeScript and JavaScript codebases against the **[Fractal Architecture Framework (FAF)](https://github.com/morriconeluca/fractal-architecture-framework)** specification ([`FAF.md`](https://github.com/morriconeluca/fractal-architecture-framework/blob/main/FAF.md)).

It enforces FAF's directory taxonomy, file naming, symbol uniqueness, encapsulation boundaries, horizontal hierarchies, and dependency graph acyclicity through a single zero-option rule: `faf/conformity`.

## Requirements

- **Node.js**: `>= 24.0.0`
- **ESLint**: `^9.0.0 || ^10.0.0` (Flat Config)

## Installation

```bash
npm install --save-dev @morriconeluca/eslint-plugin-faf eslint
```

## Quick Start

### 1. Configure ESLint

Add `faf.configs.recommended` to your `eslint.config.js` or `eslint.config.ts`:

```ts
import faf from '@morriconeluca/eslint-plugin-faf';

export default [
  faf.configs.recommended,
  // ...other ESLint configs
];
```

`faf.configs.recommended` registers the `faf` plugin, targets `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts` files, and enables `faf/conformity` as `'error'`.

#### Manual Setup and Custom Config Path

By default, the plugin searches upward from ESLint's working directory for `faf.config.ts`. To specify a custom path, set `settings.faf.configFile`:

```ts
import faf from '@morriconeluca/eslint-plugin-faf';

export default [
  {
    plugins: { faf },
    rules: {
      'faf/conformity': 'error',
    },
    settings: {
      faf: {
        configFile: 'configs/faf.config.ts',
      },
    },
  },
];
```

### 2. Create `faf.config.ts`

Create a `faf.config.ts` file at the root of your project to declare your Fractal Trees, Role catalog, and architectural rules:

```ts
import type { TFAFConfig } from '@morriconeluca/eslint-plugin-faf';

export default {
  faf: {
    locals: [
      {
        roles: [
          {
            name: 'constant',
            category: '_constants',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          {
            name: 'type',
            category: '_types',
            isCategoryNode: true,
            allowMultipleSymbols: true,
          },
          {
            name: 'util',
            category: '_utils',
            allowMultipleSymbols: true,
          },
          [
            { name: 'component', category: '_components' },
            { name: 'page', category: '_pages' },
            { name: 'service', category: '_services' },
          ],
        ],
        subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
        rootFragments: [
          {
            path: 'src',
            rootNodes: [['main.tsx']],
          },
        ],
        publicRootNodes: ['src/main.tsx'],
      },
    ],
  },
} satisfies TFAFConfig;
```

### 3. Run ESLint

Run ESLint across the whole project:

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

> **Important — Do not pass `--cache` to ESLint**: ESLint's `--cache` flag skips unchanged files, which misses cross-file architectural violations when an imported neighbor changes or moves. `eslint-plugin-faf` maintains its own graph-aware cache in `node_modules/.cache/eslint-plugin-faf`. Running `eslint --fix` remains supported: `faf/conformity` is diagnostic-only while other ESLint plugins apply their autofixes normally.

---

## `faf.config.ts` Configuration Reference

### Module Requirements

`faf.config.ts` is evaluated synchronously in an isolated worker using Node.js native TypeScript type stripping:

- Must expose a synchronous **`export default`** returning a plain serializable object (no functions, class instances, or `Promise` exports).
- The nearest `package.json` must use ESM (`"type": "module"` or omitted `"type"` — not `"type": "commonjs"`).
- Relative value imports inside `faf.config.ts` must include explicit file extensions (e.g., `./roles.ts` or `./roles.js`). `import type` statements are exempt.
- Only erasable TypeScript syntax is allowed in `faf.config.ts` and its imports (no `enum`, runtime `namespace`, or parameter properties).
- All configured paths are **POSIX relative paths** resolved from the directory containing `faf.config.ts` (e.g., `'src/main.ts'`, or `'.'` for the root directory itself — without leading `./`, `/`, trailing `/`, `..`, or `\`).

### `common` and `locals`

```ts
export default {
  faf: {
    common: {
      // Optional declarations shared across all locals entries
    },
    locals: [
      // Required non-empty array of Fractal Tree declarations
    ],
  },
} satisfies TFAFConfig;
```

- **`faf.locals`** _(required)_: Non-empty array. Each entry declares one or more Fractal Trees via `rootLayers` and/or `rootFragments`.
- **`faf.common`** _(optional)_: Shared declarations (`roles`, `subGraphRoles`, hierarchies, foreign rules, frontier rules, and `aliases`) inherited by every `locals` entry.
- **Override semantics**: When a `locals` entry defines a property also present in `common`, the local property **replaces** the `common` property in full (no shallow or deep merging).

### Tree Origins (`locals` only)

Each `locals` entry must declare `rootLayers`, `rootFragments`, or both:

- **`rootLayers`**: Non-empty array of Root Layer origin paths. Their Public Surface is determined structurally.
  ```ts
  rootLayers: ['packages/ui/src', 'packages/utils/src'];
  ```
- **`rootFragments`**: Non-empty array of Root Fragment definitions (`TFAFRootFragment`):
  ```ts
  rootFragments: [
    {
      path: 'src',
      // Tiered Rank order from Rank 0 upward; direct child file names only
      rootNodes: [['env.ts'], ['app.tsx'], ['main.tsx']],
      // Optional nested child Root Fragments
      subRootFragments: [
        {
          path: 'src/routes',
          rootNodes: [['home.tsx', 'settings.tsx']],
        },
      ],
      // Optional directed edges from this Root Fragment's rootNodes to another's
      dependencyEdges: [
        {
          from: ['app.tsx'],
          to: ['src/routes/home.tsx', 'src/routes/settings.tsx'],
        },
      ],
    },
  ];
  ```
  Every direct child file of a Root Fragment must be either listed in `rootNodes` or excluded via `foreignNodes`.

### Roles Catalog (`common` or `locals`)

Every Fractal Tree requires a `roles` catalog (defined in `locals` or inherited from `common`):

- **`roles`** (`TFAFRoles`): Array ordered from **Rank `0`** upward. Each element is either a single `TFAFRole` or a non-empty array `TFAFRole[]` of co-ranked Roles sharing the same Rank:
  - `name`: Role identifier used in `<name>.<role>.<ext>` (e.g., `'component'`).
  - `category`: Exact Category directory name with leading `_` (e.g., `'_components'`).
  - `isCategoryNode` _(optional, default `false`)_: `false` for a Category of Fragments; `true` for a Category of Category Nodes.
  - `allowMultipleSymbols` _(optional, default `false`)_: Permits multiple root-scope Symbols in explicit-Role Logical Nodes (Master Nodes still export exactly one Symbol).
  - `implicitRoleExtensions` _(optional)_: Non-empty array of dot-prefixed Asset extensions (e.g., `['.css']`, `['.png', '.svg']`). Requires Category Nodes form (`isCategoryNode` defaults to `true` and cannot be `false`).
- **`subGraphRoles`** _(optional, default `[]`)_: Auxiliary entry-point Roles at top Rank that cannot be imported by any Logical Node (e.g., `[{ name: 'spec' }, { name: 'story' }]`).

### Horizontal Hierarchies and Mimetic Paths (`common` or `locals`)

Hierarchies are arrays of Rank tiers (`string[][]`) ordered from Rank `0` upward (`[['lowest'], ['higher']]`), authorizing dependencies strictly from higher Rank to lower Rank:

- **`horizontalHierarchies`**: General hierarchies applied automatically to matching sibling Sub-Categories (e.g., Atomic Design or Systemic Design):
  ```ts
  horizontalHierarchies: [
    [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
    [
      ['_primitives'],
      ['_compounds'],
      ['_aggregates'],
      ['_systems'],
      ['_ecosystems'],
    ],
  ];
  ```
- **`localHorizontalHierarchies`**: Hierarchies bound to explicit parent directories (e.g., ordering Layers or Categories inside a Root Layer or Fractal Branch):
  ```ts
  localHorizontalHierarchies: [
    {
      paths: ['src/_src@shared'],
      hierarchies: [['_domain'], ['_network', '_state', '_ui']],
    },
  ];
  ```
- **`mimeticPathStructures`**: Designates Categories of Fragments that mirror external address spaces (REST routes, URL trees, CLI commands):
  ```ts
  mimeticPathStructures: [
    {
      paths: ['src/_apis'],
      // Optional closed catalog of <action>-<target> prefixes
      actions: ['get', 'list', 'post', 'put', 'patch', 'delete'],
    },
  ];
  ```

### Foreign Domains and Foreign Nodes (`common` or `locals`)

Exclude non-architectural files (documentation, tooling, environment declarations) from the Dependency Graph:

- **`foreignDomains`**: Directory paths excluded together with their entire subtree:
  ```ts
  foreignDomains: ['src/_tooling'];
  ```
- **`foreignNodes`**: Individual file paths or scoped glob families (`*` and `**`, case-sensitive, no negation `!` or brace expansion `{}`):
  ```ts
  foreignNodes: [
    'src/vite-env.d.ts',
    {
      paths: ['src'],
      patterns: ['*.md', '**/*.snap'],
    },
  ];
  ```

### Public Surface, Multi-Tree Relations, External Files, and Path Aliases

- **`publicRootNodes`** (`common` or `locals`): Root Node paths exposed to external consumers for Root Fragment trees (default `[]`):
  ```ts
  publicRootNodes: ['src/main.ts'];
  ```
- **`treeDependencies`** (`common` or `locals`): Directed dependencies authorized between distinct Fractal Trees (must form a DAG):
  ```ts
  treeDependencies: [
    {
      from: ['apps/web/src'],
      to: ['packages/design-system/src', 'packages/contracts/src'],
    },
  ];
  ```
- **`externalDependencies`** (`common` or `locals`): Authorizes specific internal Logical Nodes to import local codebase files located outside all Fractal Trees:
  ```ts
  externalDependencies: [
    {
      from: ['src/_adapters/legacy-client/legacy-client.adapter.ts'],
      to: ['legacy/client.ts'],
    },
  ];
  ```
- **Path Aliases** (`package.json#imports` or `faf.common.aliases`):
  - **Preferred**: Define subpath imports in `package.json` `"imports"` (e.g., `{ "#shared/*": "./src/_src@shared/*" }`) and omit `faf.common.aliases`.
  - **Alternative**: When `package.json` has no `"imports"` field, declare prefix-to-directory mappings in `faf.common.aliases` (keys without trailing `/` or `*`, values pointing to existing directories):
    ```ts
    common: {
      aliases: {
        '#shared': 'src/_src@shared',
      },
    }
    ```
  - Any `tsconfig.json` `paths` alias used inside a Fractal Tree must also be declared in one of those two sources, and intra-tree aliases must anchor to a Fractal Branch (`_<scope>@shared`).

### Exported TypeScript Types

All configuration types are exported from the package root:

```ts
import type {
  TFAFCommonConfig,
  TFAFConfig,
  TFAFExternalDependency,
  TFAFForeignNodeFamily,
  TFAFHierarchy,
  TFAFLocalConfig,
  TFAFLocalHorizontalHierarchy,
  TFAFMimeticPathStructure,
  TFAFNonEmptyArray,
  TFAFRole,
  TFAFRoles,
  TFAFRootDependencyEdge,
  TFAFRootFragment,
  TFAFSharedConfig,
  TFAFSubGraphRole,
  TFAFTreeDependency,
} from '@morriconeluca/eslint-plugin-faf';
```

---

## Diagnostics and Editor Behavior

Every `faf/conformity` violation is reported as an ESLint error (`severity: 2`) using the format:

```text
<family>/<constraint>: <message> (<FAF section>).
```

Diagnostics are grouped into six families:

- **`configuration`**: Invalid `faf.config.ts` module, schema, path syntax, or contradictory Declarations.
- **`classification`**: Unclassified entries, containment violations, missing Master/Access Nodes, invalid hierarchies, or naming violations (`kebab-case` matching `^[a-z0-9]+(?:-[a-z0-9]+)*$` is required except on Tree origins, Root Fragments, Root Nodes, Foreign Domains, and Foreign Nodes).
- **`symbol`**: Symbol uniqueness, Master Node single-export, Access Node contract, or re-export violations.
- **`dependency`**: Peer separation, Fragment/Private Category/Fractal Branch encapsulation, Root Node discipline, Tree opacity, external file, or path alias violations.
- **`acyclicity`**: Dependency cycles within a Fractal Tree or across Fractal Trees.
- **`unverified`**: Constructs that static analysis cannot verify (e.g., non-literal dynamic `import(expr)`, CommonJS `module.exports`, unresolved specifiers, or symlinks inside a Fractal Tree).

### Editor vs. Full-Project Linting

- **Deterministic anchoring**: File-level issues are reported at the offending statement; directory-level, asset, and global configuration issues are deterministically anchored to a lintable child file or `faf.config.ts`. Linting a single file in an editor shows diagnostics anchored to that file; always run `eslint .` in CI to check the entire project.
- **Automatic hot-reload**: Changes to `faf.config.ts` (or any local helper module it imports) automatically invalidate the in-memory session cache on the next lint pass without restarting your editor's ESLint server.

---

## Specification and License

- **FAF Specification**: [github.com/morriconeluca/fractal-architecture-framework](https://github.com/morriconeluca/fractal-architecture-framework)
- **License**: [MIT](./LICENSE) © [Luca Morricone](https://github.com/morriconeluca)
