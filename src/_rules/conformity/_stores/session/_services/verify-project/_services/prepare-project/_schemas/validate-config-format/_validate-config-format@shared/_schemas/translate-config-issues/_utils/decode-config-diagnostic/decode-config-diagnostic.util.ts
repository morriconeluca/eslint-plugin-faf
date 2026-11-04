import type { TConfigDiagnostic } from '../../../../_types/config-diagnostic.type.js';

import { assertInvariant } from '../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { DIAGNOSTIC_PREFIX } from '../../../../_constants/config-diagnostic.constant.js';
import { isConfigDiagnostic } from './_utils/is-config-diagnostic/index.js';

export function decodeConfigDiagnostic(message: string): TConfigDiagnostic {
  assertInvariant(
    message.startsWith(DIAGNOSTIC_PREFIX),
    'Zod issue is missing a configuration diagnostic.'
  );
  const parsed: unknown = JSON.parse(message.slice(DIAGNOSTIC_PREFIX.length));
  assertInvariant(
    isConfigDiagnostic(parsed),
    'Configuration diagnostic payload is invalid.'
  );
  return parsed;
}
