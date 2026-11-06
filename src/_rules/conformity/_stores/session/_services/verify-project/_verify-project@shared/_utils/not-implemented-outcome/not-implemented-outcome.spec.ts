import { describe, expect, it } from 'vitest';

import { notImplementedOutcome } from './index.js';

describe('notImplementedOutcome', () => {
  it('anchors an unimplemented part to the unverified not-implemented constraint', () => {
    expect(notImplementedOutcome('containment-matrix', '§6.8')).toEqual({
      constraint: 'unverified/not-implemented',
      element: 'containment-matrix',
      family: 'unverified',
      message: "'containment-matrix' is not implemented",
      normativeReference: 'D-03',
      reason: 'not-implemented',
    });
  });

  it('produces the catalog normative reference D-03 for not-implemented outcomes', () => {
    expect(notImplementedOutcome('acyclicity', '§5, §7.2')).toEqual({
      constraint: 'unverified/not-implemented',
      element: 'acyclicity',
      family: 'unverified',
      message: "'acyclicity' is not implemented",
      normativeReference: 'D-03',
      reason: 'not-implemented',
    });
  });
});
