import fs from 'fs';
import path from 'path';

import type {
  TCategoryConfig,
  TFafSettings,
  TFolderType,
  TRootFragmentConfig,
  TTreeConfig,
} from './context.type.js';

// Cache for directory traversals. Prevents redundant synchronous disk I/O (fs.readdirSync)
// across multiple rules. Cleared at the end of each ESLint run.
let dirCache: Record<string, { dirs: string[]; files: string[] }> = {};

// Cache for classifyFolder results (keyed by relDirPath; valid for the lifetime of a single ESLint run).
// Speeds up recursive parent-casing and peer-dependency checks by avoiding re-classifying folders.
const classifyCache: Map<string, TFolderType> = new Map();

// Cache for roles.flat() per unique TTreeConfig object.
// Uses a WeakMap so that if dynamic configurations are GC'd (e.g. in multi-project workspaces),
// the computed flat roles array is discarded too, preventing memory leaks.
const rolesCache = new WeakMap<TTreeConfig, string[]>();
let projectRoot = process.cwd();

// Cache for package.json subpath imports
let packageImports: null | Record<string, string> = null;

/**
 * Classifies a folder (relative directory path).
 */
export function classifyFolder(
  relDirPath: string,
  config: TTreeConfig
): TFolderType {
  const cached = classifyCache.get(relDirPath);
  if (cached !== undefined) {
    return cached;
  }

  const result = _classifyFolder(relDirPath, config);
  classifyCache.set(relDirPath, result);
  return result;
}

export function clearDirCache(): void {
  dirCache = {};
  classifyCache.clear();
  packageImports = null;
}

/**
 * Finds the tree configuration that includes the given relative file path.
 */
export function findTreeConfig(
  relPath: string,
  settings: TFafSettings
): null | TTreeConfig {
  if (!settings || !settings.trees) {
    return null;
  }

  for (const tree of settings.trees) {
    const isIncluded = tree.includes.some(
      (inc) => relPath === inc || relPath.startsWith(inc + '/')
    );
    const isExcluded = tree.excludes?.some(
      (exc) => relPath === exc || relPath.startsWith(exc + '/')
    );

    if (isIncluded && !isExcluded) {
      return tree;
    }
  }

  return null;
}

/**
 * Finds the tree configuration that includes the given relative file path, even if it is excluded.
 */
export function findTreeConfigIncludingExcluded(
  relPath: string,
  settings: TFafSettings
): null | TTreeConfig {
  if (!settings || !settings.trees) {
    return null;
  }

  for (const tree of settings.trees) {
    const isIncluded = tree.includes.some(
      (inc) => relPath === inc || relPath.startsWith(inc + '/')
    );

    if (isIncluded) {
      return tree;
    }
  }

  return null;
}

/**
 * Returns the TCategoryConfig for a given path (or its closest Category ancestor).
 */
export function getCategoryConfig(
  relDirPath: string,
  config: TTreeConfig
): null | TCategoryConfig {
  let current = relDirPath;
  while (current && current !== '.' && current !== '/') {
    const folderName = path.basename(current);
    if (folderName.startsWith('_') && !folderName.includes('@shared')) {
      const catConfig = config.categories?.find((c) => c.name === folderName);
      if (catConfig) {
        return catConfig;
      }
    } else {
      break;
    }
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Helper to extract the role of a file.
 */
export function getFileRole(
  fileName: string,
  config: TTreeConfig
): null | string {
  // Exclusions: Access nodes
  if (fileName === 'index.ts' || fileName === 'index.js') {
    return 'index';
  }

  const parts = fileName.split('.');

  // Flat list of roles — computed once per unique TTreeConfig and cached
  let allRoles = rolesCache.get(config);
  if (!allRoles) {
    allRoles = config.roles.flat();
    rolesCache.set(config, allRoles);
  }

  // Search from right to left
  for (let i = parts.length - 2; i >= 1; i--) {
    const part = parts[i];
    if (part && allRoles.includes(part)) {
      return part;
    }
  }

  return null;
}

/**
 * Gets the lowest common ancestor (LCA) and the direct sub-branches of two paths.
 */
export function getLcaAndSubBranches(
  pathA: string,
  pathB: string
): null | { lca: string; subA: string; subB: string } {
  const partsA = pathA.split('/');
  const partsB = pathB.split('/');

  let commonLength = 0;
  while (
    commonLength < partsA.length &&
    commonLength < partsB.length &&
    partsA[commonLength] === partsB[commonLength]
  ) {
    commonLength++;
  }

  if (commonLength === 0) {
    return null;
  }

  const lca = partsA.slice(0, commonLength).join('/');
  const subA = partsA[commonLength] || '';
  const subB = partsB[commonLength] || '';

  return { lca, subA, subB };
}

/**
 * Returns the owner Fragment/Root Fragment path if the given path is inside a Private Category.
 * Returns null otherwise.
 */
export function getPrivateCategoryOwner(
  relPath: string,
  config: TTreeConfig
): null | string {
  let current = relPath;
  while (current && current !== '.' && current !== '/') {
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) {
      break;
    }

    const currentType = classifyFolder(current, config);
    const parentType = classifyFolder(parent, config);

    if (
      currentType === 'category' &&
      (parentType === 'fragment' || parentType === 'root-fragment')
    ) {
      return parent;
    }

    current = parent;
  }
  return null;
}

export function getProjectRoot(): string {
  return projectRoot;
}

/**
 * Helper to find the hierarchy index of a role.
 */
export function getRoleHierarchyIndex(
  role: string,
  config: TTreeConfig
): number {
  for (let i = 0; i < config.roles.length; i++) {
    const roleGroup = config.roles[i];
    if (roleGroup && roleGroup.includes(role)) {
      return i;
    }
  }
  return -1;
}

/**
 * Gets the TRootFragmentConfig for a given Root Fragment path.
 */
export function getRootFragmentConfig(
  relDirPath: string,
  config: TTreeConfig
): null | TRootFragmentConfig {
  const checkConfig = (
    rfConfig: TRootFragmentConfig
  ): null | TRootFragmentConfig => {
    if (rfConfig.paths.includes(relDirPath)) {
      return rfConfig;
    }
    if (rfConfig.subRootFragments) {
      for (const sub of rfConfig.subRootFragments) {
        const res = checkConfig(sub);
        if (res) return res;
      }
    }
    return null;
  };

  if (config.rootFragments) {
    for (const rf of config.rootFragments) {
      const res = checkConfig(rf);
      if (res) return res;
    }
  }
  return null;
}

/**
 * Checks if A is allowed to import B according to horizontal hierarchy at a given LCA path.
 */
export function isHorizontalHierarchyAllowed(
  lcaPath: string,
  subA: string,
  subB: string,
  config: TTreeConfig
): boolean {
  return resolveHorizontalHierarchy(lcaPath, subA, subB, config).allowed;
}

/**
 * Checks if a relative directory path is a Root Fragment.
 */
export function isRootFragment(
  relDirPath: string,
  config: TTreeConfig
): boolean {
  return getRootFragmentConfig(relDirPath, config) !== null;
}

/**
 * Returns files and directories inside a given directory (relative to project root).
 */
export function readDirCached(relDirPath: string): {
  dirs: string[];
  files: string[];
} {
  const absPath = path.resolve(projectRoot, relDirPath).replace(/\\/g, '/');
  if (dirCache[absPath]) {
    return dirCache[absPath];
  }

  if (!fs.existsSync(absPath)) {
    return { dirs: [], files: [] };
  }

  try {
    const entries = fs.readdirSync(absPath, { withFileTypes: true });
    const files: string[] = [];
    const dirs: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(entry.name);
      } else if (entry.isDirectory()) {
        dirs.push(entry.name);
      }
    }

    dirCache[absPath] = { dirs, files };
    return dirCache[absPath];
  } catch {
    return { dirs: [], files: [] };
  }
}

/**
 * Resolves the horizontal hierarchy relationship between subA and subB at the given LCA path.
 * Returns whether a hierarchy is defined for this pair and, if so, whether the import is allowed.
 * Performs a single scan of local + global hierarchies to avoid redundant lookups.
 */
export function resolveHorizontalHierarchy(
  lcaPath: string,
  subA: string,
  subB: string,
  config: TTreeConfig
): { allowed: boolean; defined: boolean } {
  // 1. Check local hierarchies first
  const local = config.localHorizontalHierarchies?.find((lh) =>
    lh.paths.includes(lcaPath)
  );
  if (local) {
    const idxA = local.hierarchies.findIndex((group) => group.includes(subA));
    const idxB = local.hierarchies.findIndex((group) => group.includes(subB));
    if (idxA !== -1 && idxB !== -1) {
      return { allowed: idxB < idxA, defined: true };
    }
  }

  // 2. Check global hierarchies
  const globalHierarchies = config.globalHorizontalHierarchies || [];
  for (const gh of globalHierarchies) {
    const idxA = gh.findIndex((group) => group.includes(subA));
    const idxB = gh.findIndex((group) => group.includes(subB));
    if (idxA !== -1 && idxB !== -1) {
      return { allowed: idxB < idxA, defined: true };
    }
  }

  // No hierarchy defined for this pair — sibling imports forbidden by default
  return { allowed: false, defined: false };
}

/**
 * Resolves an import path to a project-root-relative path.
 * Returns empty string if it's an external module.
 */
export function resolveImportPath(
  importPath: string,
  currentFileRelative: string,
  settings: TFafSettings
): string {
  const pkgImports = loadPackageImports(projectRoot);
  const aliases =
    Object.keys(pkgImports).length > 0 ? pkgImports : settings?.aliases || {};

  // Check if it matches any registered alias prefix
  let matchedAlias: null | string = null;
  let longestMatch = 0;

  for (const alias of Object.keys(aliases)) {
    if (importPath === alias || importPath.startsWith(alias + '/')) {
      if (alias.length > longestMatch) {
        longestMatch = alias.length;
        matchedAlias = alias;
      }
    }
  }

  let relResolved: string;

  if (matchedAlias) {
    // 1. Alias resolution
    const target = aliases[matchedAlias];
    if (target) {
      const remainder = importPath.substring(matchedAlias.length);
      const absTarget = path.resolve(projectRoot, target + remainder);
      relResolved = toRelativePath(absTarget);
    } else {
      return ''; // Unresolved alias target
    }
  } else {
    // 2. Relative/absolute path resolution
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      const absCurrentDir = path.dirname(
        path.resolve(projectRoot, currentFileRelative)
      );
      const absResolved = path.resolve(absCurrentDir, importPath);
      relResolved = toRelativePath(absResolved);
    } else {
      return ''; // External import (e.g. library from node_modules)
    }
  }

  return finalizeResolvedPath(relResolved);
}

export function seedDirCache(
  relDirPath: string,
  files: string[],
  dirs: string[]
): void {
  const absPath = path.resolve(projectRoot, relDirPath).replace(/\\/g, '/');
  dirCache[absPath] = { dirs, files };
}

export function seedPackageImports(imports: Record<string, string>): void {
  packageImports = imports;
}

export function setProjectRoot(root: string): void {
  projectRoot = root;
}

/**
 * Normalizes a path to be relative to the project root and use forward slashes.
 */
export function toRelativePath(absoluteOrRelative: string): string {
  let abs = absoluteOrRelative;
  if (!path.isAbsolute(abs)) {
    abs = path.resolve(projectRoot, abs);
  }
  const rel = path.relative(projectRoot, abs);
  return rel.replace(/\\/g, '/');
}

function _classifyFolder(relDirPath: string, config: TTreeConfig): TFolderType {
  // Foreign domain check
  const isExcluded = config.excludes?.some(
    (exc) => relDirPath === exc || relDirPath.startsWith(exc + '/')
  );
  if (isExcluded) {
    return 'foreign';
  }

  // Root fragment check
  if (isRootFragment(relDirPath, config)) {
    return 'root-fragment';
  }

  const folderName = path.basename(relDirPath);

  // Fractal branch check
  if (folderName.startsWith('_') && folderName.includes('@shared')) {
    return 'fractal-branch';
  }

  const contents = readDirCached(relDirPath);
  const hasAccessNode = contents.files.some(
    (f) => f === 'index.ts' || f === 'index.js'
  );

  // Route path segment check (outside startsWith('_') block)
  const isRoute =
    config.routeHierarchies &&
    config.routeHierarchies.some((rh) =>
      rh.paths.some((rp) => {
        if (relDirPath.startsWith(rp + '/')) {
          const remainder = relDirPath.substring(rp.length + 1);
          const segments = remainder.split('/');
          return !segments.some(
            (seg) => seg.endsWith('@shared') || seg.includes('@shared')
          );
        }
        return false;
      })
    );

  if (isRoute && !hasAccessNode) {
    return 'layer';
  }

  if (folderName.startsWith('_')) {
    // Category check
    const catConfig = getCategoryConfig(relDirPath, config);
    if (catConfig) {
      return 'category';
    }

    return 'layer';
  }

  // Does not start with _
  // Check if it's a Category name (e.g. "utils" matches Category "_utils") and has no Access Node
  const isCategory =
    config.categories &&
    config.categories.some((c) => c.name === '_' + folderName);
  if (isCategory && !hasAccessNode) {
    return 'category';
  }

  // Check if it contains an Access Node (index.ts / index.js)
  if (hasAccessNode) {
    return 'fragment';
  }

  return 'invalid-fragment';
}

/**
 * Helper to check if a resolved relative path points to a directory with an index file,
 * or a file missing its extension, and resolves it accordingly.
 */
function finalizeResolvedPath(relResolved: string): string {
  const resolvedDir = path.dirname(relResolved).replace(/\\/g, '/');
  const resolvedBase = path.basename(relResolved);

  // 1. Check if the path itself is a directory containing index.ts/js
  const dirContents = readDirCached(relResolved);
  if (dirContents.files.includes('index.ts')) {
    return (relResolved === '.' ? '' : relResolved + '/') + 'index.ts';
  }
  if (dirContents.files.includes('index.js')) {
    return (relResolved === '.' ? '' : relResolved + '/') + 'index.js';
  }

  // 2. Check if the path is a file missing its extension
  const parentContents = readDirCached(resolvedDir);
  const exactMatch = parentContents.files.find((f) => f === resolvedBase);
  if (!exactMatch) {
    const matchWithExt = parentContents.files.find((f) =>
      f.startsWith(resolvedBase + '.')
    );
    if (matchWithExt) {
      return (resolvedDir === '.' ? '' : resolvedDir + '/') + matchWithExt;
    }
  }

  return relResolved;
}

function loadPackageImports(projectRootPath: string): Record<string, string> {
  if (packageImports !== null) {
    return packageImports;
  }

  packageImports = {};

  // Isolate the test environment from physical package.json of the host plugin codebase
  const isTest =
    typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');
  if (isTest) {
    return packageImports;
  }

  const pkgPath = path.resolve(projectRootPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent) as {
        imports?: Record<string, unknown>;
      };
      if (pkg.imports) {
        for (const [key, val] of Object.entries(pkg.imports)) {
          if (typeof val === 'string') {
            // Strip wildcards
            const cleanKey = key.endsWith('/*')
              ? key.slice(0, -2)
              : key.endsWith('*')
                ? key.slice(0, -1)
                : key;
            let cleanVal = val.endsWith('/*')
              ? val.slice(0, -2)
              : val.endsWith('*')
                ? val.slice(0, -1)
                : val;

            // Normalize target path (remove leading './' or '/')
            if (cleanVal.startsWith('./')) {
              cleanVal = cleanVal.substring(2);
            } else if (cleanVal.startsWith('/')) {
              cleanVal = cleanVal.substring(1);
            }

            packageImports[cleanKey] = cleanVal;
          }
        }
      }
    } catch {
      // Ignore parsing errors and keep packageImports empty
    }
  }

  return packageImports;
}
