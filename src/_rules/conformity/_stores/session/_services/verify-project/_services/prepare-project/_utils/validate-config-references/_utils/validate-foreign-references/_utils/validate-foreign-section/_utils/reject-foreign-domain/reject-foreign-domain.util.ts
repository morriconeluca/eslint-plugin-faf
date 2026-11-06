import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectDirectoryInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-directory-in-scope/index.js';

export function rejectForeignDomain(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const directoryOutcomes = rejectDirectoryInScope({
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
