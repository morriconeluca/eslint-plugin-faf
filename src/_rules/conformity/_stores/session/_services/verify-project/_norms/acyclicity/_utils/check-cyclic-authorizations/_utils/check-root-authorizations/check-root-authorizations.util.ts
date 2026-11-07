import type {
  TAcyclicityOutcome,
  TUnverifiedOutcome,
} from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { computeSccs } from '../../../../_acyclicity@shared/_utils/compute-sccs/index.js';
import { buildRootAuthGraph } from './_utils/build-root-auth-graph/index.js';
import { isRootCycleExercised } from './_utils/is-root-cycle-exercised/index.js';
import { selectMinElement } from './_utils/select-min-element/index.js';

export function checkRootAuthorizations(
  model: TVerificationModel,
  dependencyCycles: readonly TAcyclicityOutcome[]
): readonly TUnverifiedOutcome[] {
  const { adjacency, fragCount, fragmentPaths, nodeToFragmentPath } =
    buildRootAuthGraph(model.basis.declarations.trees);
  if (fragCount < 2) {
    return [];
  }

  const sccs = computeSccs(fragCount, adjacency);
  const cyclicFragSccs = sccs.filter((c) => c.length >= 2);
  if (cyclicFragSccs.length === 0) {
    return [];
  }

  const outcomes: TUnverifiedOutcome[] = [];

  for (const component of cyclicFragSccs) {
    const names = fragmentPaths.filter((_, index) => component.includes(index));
    names.sort(compareOrdinal);

    if (isRootCycleExercised(names, dependencyCycles, nodeToFragmentPath)) {
      continue;
    }

    const minPath = selectMinElement(names);
    outcomes.push(
      createOutcome('unverified/cyclic-root-authorization', {
        element: minPath,
        reason: 'cyclic-root-authorization',
      })
    );
  }

  return outcomes;
}
