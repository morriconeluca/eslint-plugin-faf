import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyAccessNodeContract } from './index.js';

describe('verifyAccessNodeContract', () => {
  it('returns the not-implemented outcome for access-node-contract', () => {
    expect(verifyAccessNodeContract(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'access-node-contract',
        family: 'unverified',
        message: "'access-node-contract' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
