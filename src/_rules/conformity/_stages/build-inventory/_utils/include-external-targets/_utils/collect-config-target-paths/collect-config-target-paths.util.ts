import type { TFAFConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';

import { collectSectionTargetPaths } from './_utils/collect-section-target-paths/index.js';

export function collectConfigTargetPaths(
  config: TFAFConfig
): readonly string[] {
  const commonPaths =
    config.faf.common === undefined
      ? []
      : collectSectionTargetPaths(config.faf.common);
  const aliasPaths = Object.values(config.faf.common?.aliases ?? {});
  const localSectionPaths = config.faf.locals.flatMap((local) =>
    collectSectionTargetPaths(local)
  );
  const hierarchyPaths = config.faf.locals.flatMap((local) =>
    (local.horizontalHierarchies ?? []).map((hierarchy) => hierarchy.path)
  );

  return [
    ...commonPaths,
    ...aliasPaths,
    ...localSectionPaths,
    ...hierarchyPaths,
  ];
}
