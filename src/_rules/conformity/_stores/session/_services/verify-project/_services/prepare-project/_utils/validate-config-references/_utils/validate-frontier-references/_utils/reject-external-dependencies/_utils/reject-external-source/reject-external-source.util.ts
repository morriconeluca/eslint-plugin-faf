import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { CONFIG_10 } from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectFileInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-file-in-scope/index.js';

export function rejectExternalSource(
  path: string,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return rejectFileInScope({
    context,
    label: 'External dependency source',
    normativeReference: CONFIG_10,
    path,
    propertyPath,
    scope,
  });
}
