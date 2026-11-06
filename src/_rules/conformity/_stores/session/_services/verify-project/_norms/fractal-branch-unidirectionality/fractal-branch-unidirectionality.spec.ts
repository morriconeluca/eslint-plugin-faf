import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFractalBranchUnidirectionality } from './index.js';

describe('verifyFractalBranchUnidirectionality', () => {
  it('returns the not-implemented outcome for fractal-branch-unidirectionality', () => {
    expect(verifyFractalBranchUnidirectionality(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'fractal-branch-unidirectionality',
        family: 'unverified',
        message: "'fractal-branch-unidirectionality' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
