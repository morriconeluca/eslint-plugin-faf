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
        message: "Part 'access-node-contract' is not implemented (§6.1.1).",
        normativeReference: '§6.1.1',
        reason: 'not-implemented',
      },
    ]);
  });
});
