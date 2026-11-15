import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  TItemClassification,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  NODE_ACCESS,
  NODE_FOREIGN,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function verifyExternalSources(
  byPath: ReadonlyMap<string, TItemClassification>,
  tree: TEffectiveTree,
  treeIndex: number
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [pairIndex, pair] of tree.externalDependencyPairs.entries()) {
    const classification = byPath.get(pair.from);
    if (classification === undefined) {
      continue;
    }
    const isRejectedSource =
      classification.domainKind !== null ||
      classification.nodeKind === NODE_ACCESS ||
      classification.nodeKind === NODE_FOREIGN;
    if (isRejectedSource) {
      outcomes.push(
        createOutcome('configuration/invalid-external-dependency-source', {
          element: pair.from,
          propertyPath: `trees[${treeIndex}].externalDependencyPairs[${pairIndex}].from`,
        })
      );
    }
  }
  return outcomes;
}
