import type { TAcyclicityOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { computeSccs } from '../../_acyclicity@shared/_utils/compute-sccs/index.js';
import { buildQuotientGraph } from './_utils/build-quotient-graph/index.js';
import { findInterTreeWitness } from './_utils/find-inter-tree-witness/index.js';

export function checkInterTreeCycles(
  model: TVerificationModel
): readonly TAcyclicityOutcome[] {
  const quotientGraph = buildQuotientGraph(model);
  if (quotientGraph.treeCount < 2) {
    return [];
  }

  const sccs = computeSccs(quotientGraph.treeCount, quotientGraph.adjacency);
  const outcomes: TAcyclicityOutcome[] = [];

  for (const component of sccs) {
    const witnessResult = findInterTreeWitness(
      component,
      quotientGraph.adjacency,
      quotientGraph.transitions,
      quotientGraph.treeCount
    );
    if (witnessResult === null) {
      continue;
    }
    outcomes.push(
      createOutcome('acyclicity/inter-tree-cycle', {
        cycle: witnessResult.witness,
        element: witnessResult.element,
        position: witnessResult.position,
      })
    );
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
