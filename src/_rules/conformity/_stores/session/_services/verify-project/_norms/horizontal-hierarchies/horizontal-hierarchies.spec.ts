import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyHorizontalHierarchies } from './index.js';

describe('verifyHorizontalHierarchies', () => {
  it('returns the not-implemented outcome for horizontal-hierarchies', () => {
    expect(verifyHorizontalHierarchies(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'horizontal-hierarchies',
        family: 'unverified',
        message: "'horizontal-hierarchies' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
