import type {
  TRootFragmentConfig,
  TTreeConfig,
} from '../../../_types/faf.type.js';

/**
 * Searches the tree configuration for the Root Fragment configuration matching the given path.
 * Traverses recursively down through sub-root configurations.
 *
 * @param relDirPath - Directory path relative to the project root.
 * @param config - Tree configuration.
 * @returns The matching Root Fragment configuration or null if not found.
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
