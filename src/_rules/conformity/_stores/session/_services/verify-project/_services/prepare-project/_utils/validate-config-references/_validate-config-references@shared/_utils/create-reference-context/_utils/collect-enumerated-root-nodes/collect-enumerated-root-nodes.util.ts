import type { TFAFConfig } from '../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TEnumeratedRootNode } from '../../../../_types/reference-context.type.js';

import { collectFragmentRootNodes } from './_utils/collect-fragment-root-nodes/index.js';

export function collectEnumeratedRootNodes(
  config: TFAFConfig
): ReadonlyMap<string, TEnumeratedRootNode> {
  const maps = config.faf.locals.flatMap((local) => {
    const fragments = local.rootFragments ?? [];
    return fragments.map((fragment) =>
      collectFragmentRootNodes(fragment, fragment.path)
    );
  });
  const entries = maps.flatMap((nodes) => [...nodes]);
  return new Map(entries);
}
