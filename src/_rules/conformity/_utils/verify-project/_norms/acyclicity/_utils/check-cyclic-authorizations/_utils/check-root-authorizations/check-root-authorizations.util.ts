import type {
  TAcyclicityOutcome,
  TUnverifiedOutcome,
} from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { computeSccs } from '../../../../_acyclicity@shared/_utils/compute-sccs/index.js';
import { buildRootAuthorizationGraph } from './_utils/build-root-authorization-graph/index.js';
import { isRootCycleExercised } from './_utils/is-root-cycle-exercised/index.js';

export function checkRootAuthorizations(
  model: TVerificationModel,
  dependencyCycles: readonly TAcyclicityOutcome[]
): readonly TUnverifiedOutcome[] {
  const { adjacency, fragmentCount, fragmentPaths, nodeToFragmentPath } =
    buildRootAuthorizationGraph(model.basis.declarations.trees);
  if (fragmentCount < 2) {
    return [];
  }

  const sccs = computeSccs(fragmentCount, adjacency);
  const cyclicFragmentSccs = sccs.filter((component) => component.length >= 2);
  if (cyclicFragmentSccs.length === 0) {
    return [];
  }

  const outcomes: TUnverifiedOutcome[] = [];

  for (const component of cyclicFragmentSccs) {
    const names = fragmentPaths.filter((_, index) => component.includes(index));
    names.sort(compareOrdinal);

    if (isRootCycleExercised(names, dependencyCycles, nodeToFragmentPath)) {
      continue;
    }

    const [minPath = ''] = names;
    outcomes.push(
      createOutcome.unverified('unverified/cyclic-root-authorization', {
        element: minPath,
        reason: 'cyclic-root-authorization',
      })
    );
  }

  return outcomes;
}
