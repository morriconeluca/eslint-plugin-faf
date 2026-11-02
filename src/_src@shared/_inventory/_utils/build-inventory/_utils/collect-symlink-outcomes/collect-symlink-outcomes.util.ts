import type { TOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type { TInventoryItem } from '../../../../_types/inventory.type.js';

export function collectSymlinkOutcomes(
  items: readonly TInventoryItem[]
): readonly TOutcome[] {
  const outcomes: TOutcome[] = [];

  for (const item of items) {
    if (item.isSymlink && item.treeOrigin !== null) {
      outcomes.push({
        constraint: 'unverified/symbolic-link',
        element: item.path,
        family: 'unverified',
        message: `Symbolic link '${item.path}' within tree creates ambiguous physical identity (resolves to '${item.realPath}').`,
        normativeReference: '§6',
        reason: item.realPath,
      });
    }
  }

  return outcomes;
}
