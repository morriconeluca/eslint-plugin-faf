import path from 'path';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { classifyFolder } from '../../_aggregates/classify-folder/index.js';

/**
 * Returns the owner and private category path of the private category if the given path is inside one, or null.
 */
export function getPrivateCategoryInfo(
  relPath: string,
  config: TTreeConfig
): null | { owner: string; privateCategoryPath: string } {
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
      return { owner: parent, privateCategoryPath: current };
    }

    current = parent;
  }
  return null;
}
