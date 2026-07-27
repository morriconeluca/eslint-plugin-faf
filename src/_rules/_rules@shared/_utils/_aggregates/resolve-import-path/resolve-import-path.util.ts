import fs from 'fs';
import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFafSettings } from '../../../_types/faf.type.js';

import { readDirCached } from '../../_primitives/read-dir-cached/index.js';
import { toRelativePath } from '../../_primitives/to-relative-path/index.js';

/**
 * Resolves an import path into a project-root-relative path.
 * Checks against aliases (both package.json subpath imports and faf.config.ts settings).
 * Caches mapping in `state.resolvedImportPathCache` to optimize duplicate node checks.
 *
 * @param importPath - Import value (e.g. "./helper.js" or "#_rules@shared/foo").
 * @param currentFileRelative - Path of the file performing the import, relative to root.
 * @param settings - Global FAF settings.
 * @returns The resolved project-relative path, or empty string if it's an external library.
 */
export function resolveImportPath(
  importPath: string,
  currentFileRelative: string,
  settings: TFafSettings
): string {
  const cacheKey = `${currentFileRelative}::${importPath}`;
  const cached = state.resolvedImportPathCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = _resolveImportPath(importPath, currentFileRelative, settings);
  state.resolvedImportPathCache.set(cacheKey, result);
  return result;
}

function _resolveImportPath(
  importPath: string,
  currentFileRelative: string,
  settings: TFafSettings
): string {
  const pkgImports = loadPackageImports(state.projectRoot);
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
      const absTarget = path.resolve(state.projectRoot, target + remainder);
      relResolved = toRelativePath(absTarget);
    } else {
      return ''; // Unresolved alias target
    }
  } else {
    // 2. Relative/absolute path resolution
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      const absCurrentDir = path.dirname(
        path.resolve(state.projectRoot, currentFileRelative)
      );
      const absResolved = path.resolve(absCurrentDir, importPath);
      relResolved = toRelativePath(absResolved);
    } else {
      return ''; // External import (e.g. library from node_modules)
    }
  }

  return finalizeResolvedPath(relResolved);
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
  if (state.packageImports !== null) {
    return state.packageImports;
  }

  state.packageImports = {};

  // Isolate the test environment from physical package.json of the host plugin codebase
  const isTest =
    typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');
  if (isTest) {
    return state.packageImports;
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

            state.packageImports[cleanKey] = cleanVal;
          }
        }
      }
    } catch {
      // Ignore parsing errors and keep packageImports empty
    }
  }

  return state.packageImports;
}
