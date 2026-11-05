import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyCategoryRole } from './index.js';

describe('verifyCategoryRole', () => {
  it('returns the not-implemented outcome for category-role', () => {
    expect(verifyCategoryRole(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'category-role',
        family: 'unverified',
        message: "Part 'category-role' is not implemented (§6.3.1).",
        normativeReference: '§6.3.1',
        reason: 'not-implemented',
      },
    ]);
  });
});
