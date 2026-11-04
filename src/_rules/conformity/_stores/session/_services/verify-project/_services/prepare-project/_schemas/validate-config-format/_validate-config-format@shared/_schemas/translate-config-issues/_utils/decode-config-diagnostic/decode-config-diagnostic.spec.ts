import { describe, expect, it } from 'vitest';

import { DIAGNOSTIC_PREFIX } from '../../../../_constants/config-diagnostic.constant.js';
import { decodeConfigDiagnostic } from './decode-config-diagnostic.util.js';

describe('decodeConfigDiagnostic', () => {
  it('decodes a prefixed JSON diagnostic', () => {
    const diagnostic = {
      constraint: 'configuration/null-forbidden',
      kind: 'fixed',
      message: 'Property "faf" cannot be null.',
      normativeReference: 'CONFIG_2',
    };
    const encoded = `${DIAGNOSTIC_PREFIX}${JSON.stringify(diagnostic)}`;

    expect(decodeConfigDiagnostic(encoded)).toEqual(diagnostic);
  });

  it('rejects a message that is not a configuration diagnostic', () => {
    expect(() => decodeConfigDiagnostic('not-a-diagnostic')).toThrow(
      'Zod issue is missing a configuration diagnostic.'
    );
    expect(() => decodeConfigDiagnostic(`${DIAGNOSTIC_PREFIX}[]`)).toThrow(
      'Configuration diagnostic payload is invalid.'
    );
  });
});
