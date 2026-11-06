import { describe, expect, it } from 'vitest';

import { DIAGNOSTIC_PREFIX } from '../../_constants/config-diagnostic.constant.js';
import { fixedDiagnostic } from './fixed-diagnostic.schema.js';

describe('fixedDiagnostic', () => {
  it('encodes a fixed diagnostic the translator can read', () => {
    const encoded = fixedDiagnostic('configuration/null-forbidden');
    expect(encoded.startsWith('fafdiag:')).toBe(true);
    expect(encoded.startsWith(DIAGNOSTIC_PREFIX)).toBe(true);
    expect(encoded).toContain('configuration/null-forbidden');
  });
});
