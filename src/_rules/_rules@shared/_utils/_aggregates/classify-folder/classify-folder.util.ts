import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFolderType, TTreeConfig } from '../../../_types/faf.type.js';

import { isRootFragment } from '../../_compounds/is-root-fragment/index.js';
import { getCategoryConfig } from '../../_primitives/get-category-config/index.js';
import { readDirCached } from '../../_primitives/read-dir-cached/index.js';

/**
 * Classifies a relative directory path into a FAF structural category (Layer, Category, Fragment, etc.).
 * Memoizes results in `state.classifyCache` to optimize recursive parent checks.
 *
 * @param relDirPath - Directory path relative to the project root.
 * @param config - Tree configuration.
 * @returns The classified folder type.
 */
export function classifyFolder(
  relDirPath: string,
  config: TTreeConfig
): TFolderType {
  const cached = state.classifyCache.get(relDirPath);
  if (cached !== undefined) {
    return cached;
  }

  const result = _classifyFolder(relDirPath, config);
  state.classifyCache.set(relDirPath, result);
  return result;
}

function _classifyFolder(relDirPath: string, config: TTreeConfig): TFolderType {
  const isExcluded = config.excludes?.some(
    (exc) => relDirPath === exc || relDirPath.startsWith(exc + '/')
  );
  if (isExcluded) {
    return 'foreign';
  }

  if (isRootFragment(relDirPath, config)) {
    return 'root-fragment';
  }

  const folderName = path.basename(relDirPath);

  if (folderName.startsWith('_') && folderName.includes('@shared')) {
    return 'fractal-branch';
  }

  const contents = readDirCached(relDirPath);
  const hasAccessNode = contents.files.some(
    (f) => f === 'index.ts' || f === 'index.js'
  );

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
    const catConfig = getCategoryConfig(relDirPath, config);
    if (catConfig) {
      return 'category';
    }

    return 'layer';
  }

  const isCategory =
    config.categories &&
    config.categories.some((c) => c.name === '_' + folderName);
  if (isCategory && !hasAccessNode) {
    return 'category';
  }

  if (hasAccessNode) {
    return 'fragment';
  }

  return 'invalid-fragment';
}
