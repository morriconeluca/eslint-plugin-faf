import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifySymbolUniqueness } from './index.js';

describe('verifySymbolUniqueness', () => {
  it('returns the not-implemented outcome for symbol-uniqueness', () => {
    expect(verifySymbolUniqueness(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'symbol-uniqueness',
        family: 'unverified',
        message: "'symbol-uniqueness' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
