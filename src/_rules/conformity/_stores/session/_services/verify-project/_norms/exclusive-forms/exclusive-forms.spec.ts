import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyExclusiveForms } from './index.js';

describe('verifyExclusiveForms', () => {
  it('returns the not-implemented outcome for exclusive-forms', () => {
    expect(verifyExclusiveForms(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'exclusive-forms',
        family: 'unverified',
        message: "'exclusive-forms' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
