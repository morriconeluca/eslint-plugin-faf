import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyAcyclicity } from './index.js';

describe('verifyAcyclicity', () => {
  it('returns the not-implemented outcome for acyclicity', () => {
    expect(verifyAcyclicity(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'acyclicity',
        family: 'unverified',
        message: "'acyclicity' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
