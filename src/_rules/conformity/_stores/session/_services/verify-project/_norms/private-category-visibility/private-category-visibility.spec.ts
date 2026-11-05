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
        message:
          "Part 'private-category-visibility' is not implemented (§6.3.3).",
        normativeReference: '§6.3.3',
        reason: 'not-implemented',
      },
    ]);
  });
});
