import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPrivateCategoryVisibility } from './index.js';

describe('verifyPrivateCategoryVisibility', () => {
  it('returns the not-implemented outcome for private-category-visibility', () => {
    expect(verifyPrivateCategoryVisibility(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'private-category-visibility',
        family: 'unverified',
        message: "'private-category-visibility' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
