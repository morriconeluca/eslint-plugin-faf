import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  TItemClassification,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { NODE_ROOT } from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function verifyPublicRootNodes(
  byPath: ReadonlyMap<string, TItemClassification>,
  tree: TEffectiveTree,
  treeIndex: number
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [nodeIndex, nodePath] of tree.publicRootNodes.entries()) {
    const classification = byPath.get(nodePath);
    if (classification !== undefined && classification.nodeKind !== NODE_ROOT) {
      outcomes.push(
        createOutcome('configuration/invalid-public-root-node', {
          element: nodePath,
          propertyPath: `trees[${treeIndex}].publicRootNodes[${nodeIndex}]`,
        })
      );
    }
  }
  return outcomes;
}
