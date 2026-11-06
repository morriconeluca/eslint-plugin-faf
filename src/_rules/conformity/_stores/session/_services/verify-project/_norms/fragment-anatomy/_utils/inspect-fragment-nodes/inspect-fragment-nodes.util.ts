import type { TClassificationOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TFragmentInspection } from '../../_fragment-anatomy@shared/_types/fragment-anatomy.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  ADMITTED_NODE_KINDS,
  NODE_FRAGMENT,
} from '../../_fragment-anatomy@shared/_constants/fragment-anatomy.constant.js';

export function inspectFragmentNodes(
  inspection: TFragmentInspection
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];

  for (const child of inspection.logicalChildren) {
    if (!ADMITTED_NODE_KINDS.has(child.nodeKind)) {
      outcomes.push(
        createOutcome('classification/fragment-node-anatomy', {
          element: child.path,
        })
      );
    }
  }

  const masterRank = inspection.masterRank;
  const imposedRoleName = inspection.fragmentClassification.imposedRoleName;

  if (masterRank !== null && imposedRoleName !== null) {
    for (const child of inspection.logicalChildren) {
      const isOtherFragmentNode =
        child.nodeKind === NODE_FRAGMENT &&
        child.role.roleName !== imposedRoleName;

      if (
        isOtherFragmentNode &&
        child.fragmentInternalRank !== null &&
        child.fragmentInternalRank >= masterRank
      ) {
        outcomes.push(
          createOutcome('classification/fragment-node-rank', {
            element: child.path,
          })
        );
      }
    }
  }

  return outcomes;
}
