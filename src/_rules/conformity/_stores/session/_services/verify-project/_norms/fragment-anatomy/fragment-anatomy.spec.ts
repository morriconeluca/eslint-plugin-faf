import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyFragmentAnatomy } from './index.js';

describe('verifyFragmentAnatomy', () => {
  it('returns the not-implemented outcome for fragment-anatomy', () => {
    expect(verifyFragmentAnatomy(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'fragment-anatomy',
        family: 'unverified',
        message: "'fragment-anatomy' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
