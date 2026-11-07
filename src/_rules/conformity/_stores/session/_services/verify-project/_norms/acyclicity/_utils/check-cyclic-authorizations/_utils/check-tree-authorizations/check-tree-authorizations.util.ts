import type {
  TAcyclicityOutcome,
  TUnverifiedOutcome,
} from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { computeSccs } from '../../../../_acyclicity@shared/_utils/compute-sccs/index.js';
import { buildTreeAuthGraph } from './_utils/build-tree-auth-graph/index.js';
import { isTreeCycleExercised } from './_utils/is-tree-cycle-exercised/index.js';
import { selectMinElement } from './_utils/select-min-element/index.js';

export function checkTreeAuthorizations(
  model: TVerificationModel,
  interTreeCycles: readonly TAcyclicityOutcome[]
): readonly TUnverifiedOutcome[] {
  const { adjacency, sortedOrigins, treeCount } = buildTreeAuthGraph(
    model.basis.declarations.trees
  );
  if (treeCount < 2) {
    return [];
  }

  const sccs = computeSccs(treeCount, adjacency);
  const cyclicTreeSccs = sccs.filter((c) => c.length >= 2);
  if (cyclicTreeSccs.length === 0) {
    return [];
  }

  const fileToTreeOrigin = new Map<string, string>();
  for (const item of model.basis.inventory.items) {
    if (item.treeOrigin !== null) {
      fileToTreeOrigin.set(item.path, item.treeOrigin);
    }
  }

  const outcomes: TUnverifiedOutcome[] = [];

  for (const component of cyclicTreeSccs) {
    const originNames = sortedOrigins.filter((_, index) =>
      component.includes(index)
    );
    originNames.sort(compareOrdinal);

    if (isTreeCycleExercised(originNames, interTreeCycles, fileToTreeOrigin)) {
      continue;
    }

    const minOrigin = selectMinElement(originNames);
    outcomes.push(
      createOutcome('unverified/cyclic-tree-authorization', {
        element: minOrigin,
        reason: 'cyclic-tree-authorization',
      })
    );
  }

  return outcomes;
}
