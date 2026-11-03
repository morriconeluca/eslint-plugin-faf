import type { TEffectiveDeclarations } from '../../../../../../../../_declarations/_types/declarations.type.js';
import type { TFAFConfig } from '../../../../../../../../_domain/_types/faf-config.type.js';
import type { TOwnedOrigin } from '../../../../_types/reference-context.type.js';

import { UNASSIGNED_LOCAL_INDEX } from '../../../../_constants/reference-constraints.constant.js';

export function collectOwnedOrigins(
  config: TFAFConfig,
  declarations: TEffectiveDeclarations
): ReadonlyMap<string, TOwnedOrigin> {
  const entries: [string, TOwnedOrigin][] = [];
  for (const [localIndex, local] of config.faf.locals.entries()) {
    const layers = local.rootLayers ?? [];
    for (const path of layers) {
      entries.push([path, { localIndex, originKind: 'root-layer' }]);
    }
    const fragments = local.rootFragments ?? [];
    for (const fragment of fragments) {
      entries.push([
        fragment.path,
        { localIndex, originKind: 'root-fragment' },
      ]);
    }
  }

  for (const tree of declarations.trees) {
    const isAlreadyOwned = entries.some(([path]) => path === tree.originPath);
    if (!isAlreadyOwned) {
      entries.push([
        tree.originPath,
        {
          localIndex: UNASSIGNED_LOCAL_INDEX,
          originKind: tree.originKind,
        },
      ]);
    }
  }

  return new Map(entries);
}
