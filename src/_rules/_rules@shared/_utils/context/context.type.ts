/**
 * ============================================================================
 * FRACTAL ARCHITECTURE FRAMEWORK (FAF) GLOSSARY
 * ============================================================================
 *
 * - **Root Container**: The base directory containing one or more fractal trees
 *   (e.g., `src/`).
 *
 * - **Root Fragment**: An entry point or execution trigger of the application
 *   (e.g., `src/app/` in Next.js). Contains `Root Nodes`.
 *
 * - **Root Node**: A conventional entry point or configuration file of a
 *   Root Fragment (e.g., `main.tsx`, `app.tsx`), exempt from role suffixes.
 *
 * - **Fragment**: A cohesive and self-contained logical unit (e.g., a feature,
 *   a UI component) with a single public interface (Access Node). Folder name
 *   must be kebab-case and cannot start with an underscore.
 *
 * - **Access Node**: The public entry point barrel file (`index.ts` or `index.js`)
 *   of a Fragment. Restrained to import/export only its own sibling Fragment Nodes.
 *
 * - **Fragment Node**: A Logical Node residing directly inside a Fragment. Must
 *   share the parent Fragment's name, have a unique Role suffix, and cannot
 *   be an Access Node (e.g., `button.component.tsx` inside `button/`).
 *
 * - **Master Node**: The primary implementation file of a Fragment that defines
 *   its identity and role (e.g., `use-auth.hook.ts` inside `use-auth/`).
 *
 * - **Logical Node**: Any code file representing a vertex in the dependency graph.
 *   Must end with a suffix indicating its architectural `Role` (except for Access
 *   Nodes, Root Nodes, and whitelisted static assets).
 *
 * - **Category**: An organizational directory prefixed with `_` whose name is
 *   plural (e.g. `_components`), grouping units of the same role. Must contain
 *   either only Fragments or only Logical Nodes (mutually exclusive).
 *
 * - **Private Category**: A Category nested directly inside a Fragment (or other
 *   logical domain containing files) to encapsulate private implementation details.
 *   Its contents are invisible to external importers.
 *
 * - **Layer**: An organizational directory prefixed with `_` that establishes
 *   a level of abstraction (e.g. `_ui`, `_network`). Cannot contain files directly,
 *   except for terminal route Fragments.
 *
 * - **Fractal Branch**: A shared subdirectory following the `_<Scope>@shared` syntax.
 *   Holds shared details visible only to its parent Scope and its descendants.
 *
 * - **Foreign Domain**: A directory isolating files outside the FAF dependency
 *   graph (e.g. tooling configs, global ambient types), completely ignored by the linter.
 * ============================================================================
 */

export type TCategoryConfig = {
  allowedExtensions?: string[];
  allowSingleFiles?: boolean;
  name: string;
  role?: string;
};

export type TFafSettings = {
  aliases?: Record<string, string>;
  trees: TTreeConfig[];
};

export type TFolderType =
  | 'category'
  | 'foreign'
  | 'fractal-branch'
  | 'fragment'
  | 'invalid-fragment'
  | 'layer'
  | 'root-fragment'
  | 'unknown';

export type TLocalHierarchyConfig = {
  hierarchies: string[][];
  paths: string[];
};

export type TRootFragmentConfig = {
  paths: string[];
  rootNodes: string[][];
  subRootFragments?: TRootFragmentConfig[];
};

export type TRouteHierarchyConfig = {
  paths: string[];
  role: string;
};

export type TTreeConfig = {
  categories?: TCategoryConfig[];
  excludes?: string[];
  globalHorizontalHierarchies?: string[][][];
  includes: string[];
  localHorizontalHierarchies?: TLocalHierarchyConfig[];
  roles: string[][];
  rootFragments?: TRootFragmentConfig[];
  routeHierarchies?: TRouteHierarchyConfig[];
};
