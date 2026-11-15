import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { referenceScope } from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

export function rejectForeignDomain(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const directoryOutcomes = referenceScope.rejectDirectoryInScope({
    context,
    label: 'Foreign domain',
    path,
    propertyPath,
    scope,
  });
  if (!context.ownedOrigins.has(path)) {
    return directoryOutcomes;
  }

  return [
    ...directoryOutcomes,
    createOutcome('configuration/origin-designated-foreign-domain', {
      element: path,
      propertyPath,
    }),
  ];
}
