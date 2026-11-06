import type { TConfigOutcome } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TFixedDiagnostic } from '../../../../_types/config-diagnostic.type.js';

import { createOutcome } from '../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function toFixedOutcome(
  diagnostic: TFixedDiagnostic,
  propertyPath: string
): TConfigOutcome {
  return createOutcome(diagnostic.constraint, {
    propertyPath,
  });
}
