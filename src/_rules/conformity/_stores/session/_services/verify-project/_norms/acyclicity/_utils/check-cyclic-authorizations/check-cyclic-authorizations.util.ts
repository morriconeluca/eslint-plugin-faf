import type {
  TAcyclicityOutcome,
  TUnverifiedOutcome,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { checkRootAuthorizations } from './_utils/check-root-authorizations/index.js';
import { checkTreeAuthorizations } from './_utils/check-tree-authorizations/index.js';

export function checkCyclicAuthorizations(
  model: TVerificationModel,
  interTreeCycles: readonly TAcyclicityOutcome[],
  dependencyCycles: readonly TAcyclicityOutcome[]
): readonly TUnverifiedOutcome[] {
  const treeOutcomes = checkTreeAuthorizations(model, interTreeCycles);
  const rootOutcomes = checkRootAuthorizations(model, dependencyCycles);
  const all = [...treeOutcomes, ...rootOutcomes];
  all.sort((left, right) => compareOrdinal(left.element, right.element));
  return all;
}
