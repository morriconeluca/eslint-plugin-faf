import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyReEntryProhibition } from './index.js';

describe('verifyReEntryProhibition', () => {
  it('returns the not-implemented outcome for re-entry-prohibition', () => {
    expect(verifyReEntryProhibition(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 're-entry-prohibition',
        family: 'unverified',
        message: "'re-entry-prohibition' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
