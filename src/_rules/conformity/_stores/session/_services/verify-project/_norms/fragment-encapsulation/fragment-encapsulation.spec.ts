import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFragmentEncapsulation } from './index.js';

describe('verifyFragmentEncapsulation', () => {
  it('returns the not-implemented outcome for fragment-encapsulation', () => {
    expect(verifyFragmentEncapsulation(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'fragment-encapsulation',
        family: 'unverified',
        message: "'fragment-encapsulation' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
