import type { TTreeConfig } from '../../../_types/faf.type.js';

import { getRootFragmentConfig } from '../../_primitives/get-root-fragment-config/index.js';

/**
 * Checks if a relative directory path corresponds to a configured Root Fragment.
 *
 * @param relDirPath - Directory path relative to the project root.
 * @param config - Tree configuration.
 * @returns True if the path is a Root Fragment.
 */
export function isRootFragment(
  relDirPath: string,
  config: TTreeConfig
): boolean {
  return getRootFragmentConfig(relDirPath, config) !== null;
}
