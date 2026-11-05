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
        message: "Part 'symbol-uniqueness' is not implemented (§5, §6.1.1).",
        normativeReference: '§5, §6.1.1',
        reason: 'not-implemented',
      },
    ]);
  });
});
