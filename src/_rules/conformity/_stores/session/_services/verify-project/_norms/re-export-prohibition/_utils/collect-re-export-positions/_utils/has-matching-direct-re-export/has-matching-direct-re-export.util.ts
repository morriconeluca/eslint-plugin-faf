import type {
  TModuleExport,
  TModuleImport,
} from '../../../../../../../../_session@shared/_types/module-record.type.js';

import { compareSourceLocations } from '../../../../../../_verify-project@shared/_utils/compare-source-locations/index.js';

export function hasMatchingDirectReExport(
  direct: TModuleImport,
  reExports: readonly TModuleExport[],
  handled: Set<TModuleExport>
): boolean {
  let hasMatch = false;

  for (const exp of reExports) {
    const isEligible =
      !handled.has(exp) &&
      'specifier' in exp.origin &&
      exp.origin.specifier === direct.specifier &&
      compareSourceLocations(direct.position, exp.position) <= 0;

    if (!isEligible) {
      continue;
    }

    handled.add(exp);
    hasMatch = true;
  }

  return hasMatch;
}
