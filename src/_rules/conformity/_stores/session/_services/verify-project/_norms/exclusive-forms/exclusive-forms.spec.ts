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
        message: "Part 'exclusive-forms' is not implemented (§6.3–§6.6).",
        normativeReference: '§6.3–§6.6',
        reason: 'not-implemented',
      },
    ]);
  });
});
