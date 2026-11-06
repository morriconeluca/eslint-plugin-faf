import type { TFixedDiagnostic } from '../../_types/config-diagnostic.type.js';

import { DIAGNOSTIC_PREFIX } from '../../_constants/config-diagnostic.constant.js';

export function fixedDiagnostic(
  constraint: TFixedDiagnostic['constraint']
): string {
  return `${DIAGNOSTIC_PREFIX}${JSON.stringify({
    constraint,
    kind: 'fixed',
  })}`;
}
