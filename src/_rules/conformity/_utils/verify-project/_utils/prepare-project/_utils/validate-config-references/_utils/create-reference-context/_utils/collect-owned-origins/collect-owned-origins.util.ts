import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TEffectiveDeclarations } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TOwnedOrigin } from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { UNASSIGNED_LOCAL_INDEX } from './collect-owned-origins.constant.js';

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
