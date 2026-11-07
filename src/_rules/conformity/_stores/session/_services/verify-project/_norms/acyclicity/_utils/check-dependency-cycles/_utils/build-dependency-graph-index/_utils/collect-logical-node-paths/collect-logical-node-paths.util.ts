import type { TVerificationModel } from '../../../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function collectLogicalNodePaths(
  model: TVerificationModel
): readonly string[] {
  const logicalPaths: string[] = [];
  for (const item of model.basis.inventory.items) {
    if (item.kind !== 'file' || item.treeOrigin === null) {
      continue;
    }
    const classification = model.taxonomy.byItemId.get(item.id);
    if (
      classification !== undefined &&
      classification.nodeKind !== null &&
      classification.nodeKind !== 'foreign-node'
    ) {
      logicalPaths.push(item.path);
    }
  }
  const sorted = [...logicalPaths];
  sorted.sort(compareOrdinal);
  return sorted;
}
