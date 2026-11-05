import type { TUnverifiedOutcome } from '../../../../../../../_conformity@shared/_types/outcome.type.js';

export function notImplementedOutcome(
  element: string,
  normativeReference: string
): TUnverifiedOutcome {
  return {
    constraint: 'unverified/not-implemented',
    element,
    family: 'unverified',
    message: `Part '${element}' is not implemented (${normativeReference}).`,
    normativeReference,
    reason: 'not-implemented',
  };
}
