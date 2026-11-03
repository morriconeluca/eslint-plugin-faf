import type { TEffectiveTree } from '../../../../../../../_declarations/_types/declarations.type.js';
import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type { TItemClassification } from '../../../../../../_types/classification.type.js';

import {
  CONFIGURATION_FAMILY,
  CONSTRAINT_INVALID_EXTERNAL_DEPENDENCY_SOURCE,
  NODE_ACCESS,
  NODE_FOREIGN,
  NORMATIVE_CONFIG_10,
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
      outcomes.push({
        constraint: CONSTRAINT_INVALID_EXTERNAL_DEPENDENCY_SOURCE,
        element: pair.from,
        family: CONFIGURATION_FAMILY,
        message: `externalDependencies.from '${pair.from}' must identify a Logical Node that is neither an Access Node nor a Foreign Node.`,
        normativeReference: NORMATIVE_CONFIG_10,
        propertyPath: `trees[${treeIndex}].externalDependencyPairs[${pairIndex}].from`,
      });
    }
  }
  return outcomes;
}
