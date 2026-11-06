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
        message: "'category-role' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
