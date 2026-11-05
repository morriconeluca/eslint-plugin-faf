import { describe, expect, it } from 'vitest';

import { notImplementedOutcome } from './index.js';

describe('notImplementedOutcome', () => {
  it('anchors an unimplemented part to the unverified not-implemented constraint', () => {
    expect(notImplementedOutcome('containment-matrix', '§6.8')).toEqual({
      constraint: 'unverified/not-implemented',
      element: 'containment-matrix',
      family: 'unverified',
      message: "Part 'containment-matrix' is not implemented (§6.8).",
      normativeReference: '§6.8',
      reason: 'not-implemented',
    });
  });

  it('keeps the part name and the FAF section distinct', () => {
    expect(notImplementedOutcome('acyclicity', '§5, §7.2')).toEqual({
      constraint: 'unverified/not-implemented',
      element: 'acyclicity',
      family: 'unverified',
      message: "Part 'acyclicity' is not implemented (§5, §7.2).",
      normativeReference: '§5, §7.2',
      reason: 'not-implemented',
    });
  });
});
