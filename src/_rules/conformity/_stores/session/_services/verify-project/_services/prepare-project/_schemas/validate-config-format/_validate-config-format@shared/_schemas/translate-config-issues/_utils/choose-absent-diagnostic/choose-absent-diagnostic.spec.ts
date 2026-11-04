import { describe, expect, it } from 'vitest';

import { chooseAbsentDiagnostic } from './choose-absent-diagnostic.util.js';

const diagnostic = {
  emptyList: {
    constraint: 'configuration/empty-list',
    kind: 'fixed',
    message: 'empty',
    normativeReference: 'CONFIG_5',
  },
  explicit: {
    constraint: 'configuration/explicit-undefined',
    kind: 'fixed',
    message: 'explicit',
    normativeReference: 'CONFIG_2',
  },
  invalid: {
    constraint: 'configuration/invalid-type',
    kind: 'fixed',
    message: 'invalid',
    normativeReference: 'CONFIG_2',
  },
  kind: 'absent',
  missing: {
    constraint: 'configuration/missing-property',
    kind: 'fixed',
    message: 'missing',
    normativeReference: 'CONFIG_2',
  },
} as const;

describe('chooseAbsentDiagnostic', () => {
  it('prefers empty-list, then explicit undefined, then missing', () => {
    expect(chooseAbsentDiagnostic(diagnostic, true, false).constraint).toBe(
      'configuration/empty-list'
    );
    expect(chooseAbsentDiagnostic(diagnostic, false, true).constraint).toBe(
      'configuration/explicit-undefined'
    );
    expect(chooseAbsentDiagnostic(diagnostic, false, false).constraint).toBe(
      'configuration/missing-property'
    );
  });
});
