import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyForeignNodeIsolation } from './index.js';

describe('verifyForeignNodeIsolation', () => {
  it('returns the not-implemented outcome for foreign-node-isolation', () => {
    expect(verifyForeignNodeIsolation(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'foreign-node-isolation',
        family: 'unverified',
        message: "'foreign-node-isolation' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
