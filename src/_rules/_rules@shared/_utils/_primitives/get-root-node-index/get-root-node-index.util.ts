import path from 'path';

import type { TRootFragmentConfig } from '../../../_types/faf.type.js';

/**
 * Returns the index of the `rootNodes` group containing `relPath` (resolved relative to
 * `lcaPath`), or -1 if `relPath` isn't a configured Root Node under `rfConfig`.
 *
 * @param relPath - Path relative to the project root.
 * @param rfConfig - Root Fragment configuration.
 * @param lcaPath - Path of the Root Fragment (or common ancestor) `relPath` is resolved against.
 * @returns The matching `rootNodes` group index, or -1.
 */
export function getRootNodeIndex(
  relPath: string,
  rfConfig: TRootFragmentConfig,
  lcaPath: string
): number {
  const relToLca = path.relative(lcaPath, relPath).replace(/\\/g, '/');
  for (let i = 0; i < rfConfig.rootNodes.length; i++) {
    const group = rfConfig.rootNodes[i];
    if (group && group.includes(relToLca)) {
      return i;
    }
  }
  return -1;
}
