import type { TAcyclicityOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { computeSccs } from '../../_acyclicity@shared/_utils/compute-sccs/index.js';
import { buildDependencyGraphIndex } from './_utils/build-dependency-graph-index/index.js';
import { findCycleWitness } from './_utils/find-cycle-witness/index.js';

export function checkDependencyCycles(
  model: TVerificationModel
): readonly TAcyclicityOutcome[] {
  const index = buildDependencyGraphIndex(model);
  if (index.nodeCount === 0) {
    return [];
  }

  const sccs = computeSccs(index.nodeCount, index.adjacency);
  const outcomes: TAcyclicityOutcome[] = [];

  for (const component of sccs) {
    const witnessResult = findCycleWitness(
      component,
      index.selfLoopSet,
      index.adjacency,
      index.logicalPaths,
      index.nodeCount
    );
    if (witnessResult === null) {
      continue;
    }
    const edge = index.edgeBySourceAndDestination.get(
      `${witnessResult.element}\0${witnessResult.secondNode}`
    );
    outcomes.push(
      createOutcome('acyclicity/dependency-cycle', {
        cycle: [witnessResult.witness],
        element: witnessResult.element,
        position: edge?.position,
      })
    );
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
