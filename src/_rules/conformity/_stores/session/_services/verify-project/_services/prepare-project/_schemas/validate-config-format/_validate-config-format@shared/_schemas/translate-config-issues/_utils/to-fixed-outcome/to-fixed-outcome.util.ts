import type { TConfigOutcome } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TFixedDiagnostic } from '../../../../_types/config-diagnostic.type.js';

export function toFixedOutcome(
  diagnostic: TFixedDiagnostic,
  propertyPath: string
): TConfigOutcome {
  return {
    constraint: diagnostic.constraint,
    element: propertyPath,
    family: 'configuration',
    message: diagnostic.message.split('{path}').join(propertyPath),
    normativeReference: diagnostic.normativeReference,
    propertyPath,
  };
}
