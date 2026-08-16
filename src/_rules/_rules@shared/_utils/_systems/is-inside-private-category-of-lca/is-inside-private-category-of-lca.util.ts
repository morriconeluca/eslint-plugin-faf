import path from 'path';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { classifyFolder } from '../../_aggregates/classify-folder/index.js';

/**
 * Checks if B is inside a Private Category of the LCA directory.
 */
export function isInsidePrivateCategoryOfLca(
  relPathB: string,
  lcaPath: string,
  config: TTreeConfig
): boolean {
  let current = relPathB;
  while (current && current !== '.' && current !== '/' && current !== lcaPath) {
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) {
      break;
    }

    const currentType = classifyFolder(current, config);
    const parentType = classifyFolder(parent, config);

    if (
      currentType === 'category' &&
      (parentType === 'fragment' || parentType === 'root-fragment') &&
      parent === lcaPath
    ) {
      return true;
    }

    current = parent;
  }
  return false;
}
