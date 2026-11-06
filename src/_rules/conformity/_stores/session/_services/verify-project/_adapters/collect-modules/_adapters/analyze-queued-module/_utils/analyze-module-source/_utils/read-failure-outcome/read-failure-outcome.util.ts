import type { TUnverifiedOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReadFailureInput } from './read-failure-outcome.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function readFailureOutcome(
  input: TReadFailureInput
): TUnverifiedOutcome {
  const constraint:
    | 'unverified/unreadable-entry'
    | 'unverified/unreadable-external-file' = input.isTreeFile
    ? 'unverified/unreadable-entry'
    : 'unverified/unreadable-external-file';

  return createOutcome(constraint, {
    detail: input.reason,
    element: input.relativePath,
    reason: input.reason,
  });
}
