import path from 'path';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { classifyFolder } from '../../_aggregates/classify-folder/index.js';

/**
 * Identifies the owner Fragment/Root Fragment path if the given path is situated inside a Private Category.
 * Traverses up the directory structure.
 *
 * @param relPath - Path to inspect, relative to project root.
 * @param config - Tree configuration.
 * @returns The path of the owning Fragment or null if not inside a Private Category.
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
