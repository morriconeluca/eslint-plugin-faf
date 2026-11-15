import type { TFAFForeignNodeFamily } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { referenceScope } from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

export function rejectForeignNodeEntry(
  entry: string | TFAFForeignNodeFamily,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  if (typeof entry === 'string') {
    return referenceScope.rejectFileInScope({
      context,
      label: 'Foreign node',
      path: entry,
      propertyPath,
      scope,
    });
  }

  return entry.paths.flatMap((path, index) =>
    referenceScope.rejectDirectoryInScope({
      context,
      label: 'Foreign family path',
      path,
      propertyPath: `${propertyPath}.paths[${index}]`,
      scope,
    })
  );
}
