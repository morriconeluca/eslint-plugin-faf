import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { referenceScope } from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

export function rejectExternalSource(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return referenceScope.rejectFileInScope({
    context,
    label: 'External dependency source',
    path,
    propertyPath,
    scope,
  });
}
