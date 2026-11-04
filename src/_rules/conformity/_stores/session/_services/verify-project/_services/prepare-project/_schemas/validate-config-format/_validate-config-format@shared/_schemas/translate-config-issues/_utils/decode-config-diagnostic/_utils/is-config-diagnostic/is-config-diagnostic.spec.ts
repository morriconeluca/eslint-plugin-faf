import { describe, expect, it } from 'vitest';

import { isConfigDiagnostic } from './is-config-diagnostic.util.js';

describe('isConfigDiagnostic', () => {
  it('accepts a fixed diagnostic and rejects a primitive', () => {
    expect(
      isConfigDiagnostic({
        constraint: 'configuration/null-forbidden',
        kind: 'fixed',
        message: 'Property "faf" cannot be null.',
        normativeReference: 'CONFIG_2',
      })
    ).toBe(true);
    expect(isConfigDiagnostic('fixed')).toBe(false);
  });
});
