import type { TFAFForeignNodeFamily } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { CONFIG_6 } from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectDirectoryInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-directory-in-scope/index.js';
import { rejectFileInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-file-in-scope/index.js';

export function rejectForeignNodeEntry(
  entry: string | TFAFForeignNodeFamily,
  propertyPath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  if (typeof entry === 'string') {
    return rejectFileInScope({
      context,
      label: 'Foreign node',
      normativeReference: CONFIG_6,
      path: entry,
      propertyPath,
      scope,
    });
  }

  return entry.paths.flatMap((path, index) =>
    rejectDirectoryInScope({
      context,
      label: 'Foreign family path',
      normativeReference: CONFIG_6,
      path,
      propertyPath: `${propertyPath}.paths[${index}]`,
      scope,
    })
  );
}
