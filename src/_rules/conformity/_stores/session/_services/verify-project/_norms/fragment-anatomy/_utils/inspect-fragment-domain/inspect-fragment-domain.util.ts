import type { TClassificationOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TFragmentInspection } from '../../_fragment-anatomy@shared/_types/fragment-anatomy.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import {
  FRAGMENT_OR_SUB_GRAPH_KINDS,
  MASTER_CANDIDATE_KINDS,
  NODE_ACCESS,
} from '../../_fragment-anatomy@shared/_constants/fragment-anatomy.constant.js';

export function inspectFragmentDomain(
  inspection: TFragmentInspection
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const fragmentPath = inspection.fragmentClassification.path;
  const imposedRoleName = inspection.fragmentClassification.imposedRoleName;

  const hasAccessNode = inspection.logicalChildren.some(
    (child) => child.nodeKind === NODE_ACCESS
  );
  if (!hasAccessNode) {
    outcomes.push(
      createOutcome('classification/missing-access-node', {
        element: fragmentPath,
      })
    );
  }

  const hasMasterCandidate = inspection.logicalChildren.some(
    (child) =>
      child.role.roleName === imposedRoleName &&
      MASTER_CANDIDATE_KINDS.has(child.nodeKind)
  );
  if (!hasMasterCandidate) {
    outcomes.push(
      createOutcome('classification/missing-master-node', {
        element: fragmentPath,
      })
    );
  }

  const explicitRoleCounts = new Map<string, number>();
  for (const child of inspection.logicalChildren) {
    const roleName = child.role.roleName;
    if (roleName === null || !FRAGMENT_OR_SUB_GRAPH_KINDS.has(child.nodeKind)) {
      continue;
    }
    const current = explicitRoleCounts.get(roleName) ?? 0;
    explicitRoleCounts.set(roleName, current + 1);
  }

  const duplicatedRoleNames: string[] = [];
  for (const [roleName, count] of explicitRoleCounts) {
    if (count > 1) {
      duplicatedRoleNames.push(roleName);
    }
  }
  duplicatedRoleNames.sort(compareOrdinal);

  const duplicateOutcomes = duplicatedRoleNames.map(() =>
    createOutcome('classification/duplicate-fragment-role', {
      element: fragmentPath,
    })
  );
  outcomes.push(...duplicateOutcomes);

  return outcomes;
}
