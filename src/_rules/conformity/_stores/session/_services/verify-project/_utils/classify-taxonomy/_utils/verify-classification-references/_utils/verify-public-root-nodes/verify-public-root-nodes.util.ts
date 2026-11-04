import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import {
  CONFIGURATION_FAMILY,
  CONSTRAINT_INVALID_PUBLIC_ROOT_NODE,
  NODE_ROOT,
  NORMATIVE_CONFIG_10,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function verifyPublicRootNodes(
  byPath: ReadonlyMap<string, TItemClassification>,
  tree: TEffectiveTree,
  treeIndex: number
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [nodeIndex, nodePath] of tree.publicRootNodes.entries()) {
    const classification = byPath.get(nodePath);
    if (classification !== undefined && classification.nodeKind !== NODE_ROOT) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_PUBLIC_ROOT_NODE,
        element: nodePath,
        family: CONFIGURATION_FAMILY,
        message: `publicRootNodes entry '${nodePath}' does not identify a Root Node.`,
        normativeReference: NORMATIVE_CONFIG_10,
        propertyPath: `trees[${treeIndex}].publicRootNodes[${nodeIndex}]`,
      });
    }
  }
  return outcomes;
}
