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
        message:
          "Part 'fractal-branch-unidirectionality' is not implemented (§6.6.2).",
        normativeReference: '§6.6.2',
        reason: 'not-implemented',
      },
    ]);
  });
});
