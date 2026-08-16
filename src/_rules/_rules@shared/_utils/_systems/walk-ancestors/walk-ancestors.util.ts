import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TAncestorEntry, TTreeConfig } from '../../../_types/faf.type.js';

import { classifyFolder } from '../../_aggregates/classify-folder/index.js';

/**
 * Walks up from a directory to the boundary of the tree's `includes`/`excludes`,
 * classifying each ancestor level along with its parent. Result is cached in
 * `state.ancestorChainCache` since the same chain is re-visited by every file
 * nested underneath it.
 *
 * @param relDir - Directory path relative to the project root.
 * @param config - Tree configuration.
 * @returns The ancestor chain, from `relDir` up to (excluding) the tree boundary.
 */
export function walkAncestors(
  relDir: string,
  config: TTreeConfig
): TAncestorEntry[] {
  const cached = state.ancestorChainCache.get(relDir);
  if (cached !== undefined) {
    return cached;
  }

  const result: TAncestorEntry[] = [];
  let currentDir = relDir;

  while (currentDir && currentDir !== '.' && currentDir !== '/') {
    const isInTree = config.includes.some(
      (inc) => currentDir === inc || currentDir.startsWith(inc + '/')
    );
    const isExcluded =
      config.excludes?.some(
        (exc) => currentDir === exc || currentDir.startsWith(exc + '/')
      ) ?? false;

    if (!isInTree || isExcluded) {
      break;
    }

    const folderName = path.basename(currentDir);
    const type = classifyFolder(currentDir, config);

    const parentDir = path.dirname(currentDir).replace(/\\/g, '/');
    const parentFolderName = path.basename(parentDir);
    // 'unknown' means parentDir falls outside any configured tree path,
    // i.e. it is the literal Root Container
    const parentType: TAncestorEntry['parentType'] =
      parentDir === '.' || parentDir === '/'
        ? 'unknown'
        : classifyFolder(parentDir, config);

    result.push({
      dir: currentDir,
      folderName,
      parentDir,
      parentFolderName,
      parentType,
      type,
    });

    currentDir = parentDir;
  }

  state.ancestorChainCache.set(relDir, result);
  return result;
}
