import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFractalBranchVisibility } from './index.js';

describe('verifyFractalBranchVisibility', () => {
  it('returns the not-implemented outcome for fractal-branch-visibility', () => {
    expect(verifyFractalBranchVisibility(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'fractal-branch-visibility',
        family: 'unverified',
        message: "'fractal-branch-visibility' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
