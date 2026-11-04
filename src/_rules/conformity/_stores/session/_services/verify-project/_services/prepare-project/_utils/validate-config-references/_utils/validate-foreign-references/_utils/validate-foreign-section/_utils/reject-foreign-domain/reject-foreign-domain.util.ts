import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_4,
  CONFIG_6,
  CONSTRAINT_ORIGIN_DESIGNATED_FOREIGN_DOMAIN,
} from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
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
    normativeReference: CONFIG_6,
    path,
    propertyPath,
    scope,
  });
  if (!context.ownedOrigins.has(path)) {
    return directoryOutcomes;
  }

  return [
    ...directoryOutcomes,
    {
      constraint: CONSTRAINT_ORIGIN_DESIGNATED_FOREIGN_DOMAIN,
      element: path,
      family: 'configuration',
      message: `Foreign domain "${path}" cannot designate an origin directory.`,
      normativeReference: CONFIG_4,
      propertyPath,
    },
  ];
}
