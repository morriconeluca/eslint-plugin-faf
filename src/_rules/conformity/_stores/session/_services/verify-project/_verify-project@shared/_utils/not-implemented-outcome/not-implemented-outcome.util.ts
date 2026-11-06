import type { TUnverifiedOutcome } from '../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function notImplementedOutcome(
  element: string,
  _normativeReference?: string
): TUnverifiedOutcome {
  return createOutcome('unverified/not-implemented', {
    element,
    reason: 'not-implemented',
  });
}
