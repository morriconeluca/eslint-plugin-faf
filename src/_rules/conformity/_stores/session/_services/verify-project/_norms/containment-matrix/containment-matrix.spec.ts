import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyContainmentMatrix } from './index.js';

describe('verifyContainmentMatrix', () => {
  it('returns the not-implemented outcome for containment-matrix', () => {
    expect(verifyContainmentMatrix(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'containment-matrix',
        family: 'unverified',
        message: "Part 'containment-matrix' is not implemented (§6.8).",
        normativeReference: '§6.8',
        reason: 'not-implemented',
      },
    ]);
  });
});
